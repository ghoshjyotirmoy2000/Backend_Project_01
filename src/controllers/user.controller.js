import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res) => {

     console.log(req.body)

    // get user details from frontend
    const{userName,email,fullName,password} =  req.body
    // console.log(req.body )



    // validation - not empty
    if([fullName,email,userName,password].some((field) => field?. trim === "")){
        throw new ApiError(400, "All Fields are required")
    }



    // check is user already exists using username/email
    const existedUser = await User.findOne({
        $or : [{email} , {userName}]
    })
    if(existedUser) {
        throw new ApiError(409,"User with email r username already exists")
    }



    // check for images and avatar(required)
    const avatarLocalPath = req.files?.avatar[0]?.path
    // console.log(req.files)
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }



    //upload them to cloudinary , avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is Needed")
    }



    //create a user object  and make a create entry in db
    //remove password and refresh token field from response 
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        userName : userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )



    //check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }



    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser , "User registerd successfully")
    )
     

})

export {registerUser}