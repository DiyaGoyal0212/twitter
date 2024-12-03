import { User } from "../models/userSchema.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const Register = async (req, res) => {
    try {
        const { name, username, email, password } = req.body;
        // basic validation
        if (!name || !username || !email || !password) {
            return res.status(401).json({
                message: "All fields are required.",
                success: false
            })
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "User already exist.",
                success: false
            })
        }
        const hashedPassword = await bcryptjs.hash(password, 16);

        await User.create({
            name,
            username,
            email,
            password: hashedPassword
        });
        return res.status(201).json({
            message: "Account created successfully.",
            success: true
        })

    } catch (error) {
        console.log(error);
    }
}
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "All fields are required.",
                success: false
            })
        };
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password",
                success: false
            })
        }
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: "Incorect email or password",
                success: false
            });
        }
        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET, { expiresIn: "1d" });
        return res.status(201).cookie("token", token, { expiresIn: "1d", httpOnly: true }).json({
            message: `Welcome back ${user.name}`,
            user,
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const logout = (req, res) => {
    return res.cookie("token", "", { expiresIn: new Date(Date.now()) }).json({
        message: "user logged out successfully.",
        success: true
    })
}

export const listProduct = async (req, res) => {
    try {
        const users = await User.find({}); // Adjust as necessary
        console.log("Fetched users:", users); // Log data being returned
        res.status(200).json({
            success: true,
            products: users, // Check this key matches frontend expectations
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

export const bookmark = async (req, res) => {
    try {
        const { id: loggedInUserId } = req.body; // Extract logged-in user ID
        const { id: tweetId } = req.params; // Extract tweet ID from URL params

        // Validate required fields
        if (!loggedInUserId || !tweetId) {
            return res.status(400).json({
                success: false,
                message: "User ID and Tweet ID are required.",
            });
        }

        // Find the user and toggle the bookmark
        const user = await User.findById(loggedInUserId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        let message;
        if (user.bookmarks.includes(tweetId)) {
            // Remove from bookmarks
            await User.findByIdAndUpdate(loggedInUserId, { $pull: { bookmarks: tweetId } });
            message = "Removed from bookmarks.";
        } else {
            // Add to bookmarks
            await User.findByIdAndUpdate(loggedInUserId, { $push: { bookmarks: tweetId } });
            message = "Saved to bookmarks.";
        }

        // Fetch updated user bookmarks
        const updatedUser = await User.findById(loggedInUserId, { bookmarks: 1 });

        // Respond to the client
        return res.status(200).json({
            success: true,
            message,
            bookmarks: updatedUser.bookmarks,
        });
    } catch (error) {
        console.error("Error in bookmarking:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing the request.",
        });
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id).select("-password");
        return res.status(200).json({
            user,
        })
    } catch (error) {
        console.log(error);
    }
};

export const getOtherUsers = async (req,res) =>{ 
    try {
         const {id} = req.params;
         const otherUsers = await User.find({_id:{$ne:id}}).select("-password");
         if(!otherUsers){
            return res.status(401).json({
                message:"Currently do not have any users."
            })
         };
         return res.status(200).json({
            otherUsers
        })
    } catch (error) {
        console.log(error);
    }
}

export const follow = async(req,res)=>{
    try {
        const loggedInUserId = req.body.id; 
        const userId = req.params.id; 
        const loggedInUser = await User.findById(loggedInUserId);//patel
        const user = await User.findById(userId);//keshav
        if(!user.followers.includes(loggedInUserId)){
            await user.updateOne({$push:{followers:loggedInUserId}});
            await loggedInUser.updateOne({$push:{following:userId}});
        }else{
            return res.status(400).json({
                message:`User already followed to ${user.name}`
            })
        };
        return res.status(200).json({
            message:`${loggedInUser.name} just follow to ${user.name}`,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}
export const unfollow = async (req,res) => {
    try {
        const loggedInUserId = req.body.id; 
        const userId = req.params.id; 
        const loggedInUser = await User.findById(loggedInUserId);//patel
        const user = await User.findById(userId);//keshav
        if(loggedInUser.following.includes(userId)){
            await user.updateOne({$pull:{followers:loggedInUserId}});
            await loggedInUser.updateOne({$pull:{following:userId}});
        }else{
            return res.status(400).json({
                message:`User has not followed yet`
            })
        };
        return res.status(200).json({
            message:`${loggedInUser.name} unfollow to ${user.name}`,
            success:true
        })
    } catch (error) {
        console.log(error);
    }
}