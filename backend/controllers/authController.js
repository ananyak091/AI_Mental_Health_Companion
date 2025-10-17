import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

//Register new user
export const registerUser = async (req , res) => {
  try{
    const {name, email, password} = req.body;

    const existingUser = await User.findOne({email});
    if(existingUser) return res.status(400).json({message: "User already exists"});

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name, email, password: hashedPassword,
    });

    res.status(201).json({message: "User registered successfully", user: newUser})
  } catch(error) {
    res.status(500).json({message: error.message});
  }
  
}

//Login User
  export const loginUser = async (req, res) => {
    try{
    const {email, password} = req.body;

    const user = await User.findOne({email});
    if(!user) return res.status(404).json({message: "User not found"});

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({message: "Invalid password"});

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "7d"});

    res.json({message: "Login successful", token, user});
  } catch(error) {
    res.status(500).json({message: error.message});
  }
}