import { User, IUser } from "../models/user.model"
import { hashPassword, comparePassword } from "../utils/password"
import { generateToken, JWTPayload } from "../utils/jwt"
import { ConflictError, UnauthorizedError, NotFoundError } from "../utils/errors"

export interface RegisterData {
   name: string
   email: string
   password: string
}

export interface LoginData {
   email: string
   password: string
}

export interface AuthResponse {
   token: string
   user: {
      _id: string
      name: string
      email: string
      role: "USER" | "ADMIN"
      walletBalance: number
      exposure: number
   }
}

export const registerUser = async (data: RegisterData): Promise<IUser> => {
   const { name, email, password } = data

   const existingUser = await User.findOne({ email })
   if (existingUser) {
      throw new ConflictError("Email already registered", "EMAIL_EXISTS")
   }

   const passwordHash = await hashPassword(password)

   const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "USER",
   })

   await user.save()
   return user
}

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
   const { email, password } = data

   const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      "+passwordHash"
   )
   if (!user) {
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS")
   }

   const isPasswordValid = await comparePassword(password, user.passwordHash)
   if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS")
   }

   const payload: JWTPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
   }
   const token = generateToken(payload)

   return {
      token,
      user: {
         _id: user._id.toString(),
         name: user.name,
         email: user.email,
         role: user.role,
        walletBalance: user.walletBalance ?? 100,
        exposure: user.exposure ?? 0,
      },
   }
}

export const getUserById = async (userId: string): Promise<IUser> => {
   const user = await User.findById(userId)
   if (!user) {
      throw new NotFoundError("User not found", "USER_NOT_FOUND")
   }
   return user
}
