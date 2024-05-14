import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError"
import {User} from "../models/user.model"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse"

const registerUser = asyncHandler(async (req,res) => {

    // get user details from frontend
    const{userName,email,fullName,password} =  req.body

    // validation -not empty
    if([fullName,email,userName,password].some((field) => field?.trim === "")){
        throw new ApiError(400, "All Fields are required")
    }

    // check is user already exists : username,email
    const existedUser = User.findOne({
        $or : [{email} , {userName}]
    })
    if(existedUser) {
        throw new ApiError(409,"User with email r username already exists")
    }

    // checkfor images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is reqired")
    }

    //upload them to cloudinary , avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is reqired")
    }

    //create user object -create entry in db
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
        throw new ApiError(500, "Something went wrong")
    }

    //return response

    return res.status(201).json(
        new ApiResponse(200, createdUser , "User registerd successfully")
    )
    

})

export {registerUser}