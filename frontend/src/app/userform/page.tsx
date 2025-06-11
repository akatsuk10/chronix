"use client"

import { useForm } from "react-hook-form"
import { useAppDispatch } from "@/store/index"
import { setProfile } from "@/store/slices/userSlice"
import axios from "axios"

type UserProfileFormData = {
  username: string
  email: string
  country: string
  referralCode?: string
  lotteryOptIn: boolean
}

export default function UserProfileForm() {
  const dispatch = useAppDispatch()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserProfileFormData>()

  const onSubmit = async (data: UserProfileFormData) => {
    try {
      // Store in Redux first
      dispatch(setProfile(data))

      // Send to Backend API
      //await axios.post("/api/user-profile", data)

      alert(JSON.stringify(data))
    } catch (error) {
      console.error("Error submitting profile:", error)
      alert("Error submitting profile")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto space-y-4">
      <div>
        <label className="block font-medium">Username</label>
        <input
          {...register("username", { required: "Username is required" })}
          className="w-full border rounded px-3 py-2"
        />
        {errors.username && <p className="text-red-500">{errors.username.message}</p>}
      </div>

      <div>
        <label className="block font-medium">Email</label>
        <input
          type="email"
          {...register("email", { required: "Email is required" })}
          className="w-full border rounded px-3 py-2"
        />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block font-medium">Country</label>
        <input
          {...register("country", { required: "Country is required" })}
          className="w-full border rounded px-3 py-2"
        />
        {errors.country && <p className="text-red-500">{errors.country.message}</p>}
      </div>

      <div>
        <label className="block font-medium">Referral Code (Optional)</label>
        <input
          {...register("referralCode")}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          {...register("lotteryOptIn")}
          id="lotteryOptIn"
          className="h-4 w-4"
        />
        <label htmlFor="lotteryOptIn" className="text-sm">
          Opt-in for Lottery Participation
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700"
      >
        {isSubmitting ? "Submitting..." : "Submit Profile"}
      </button>
    </form>
  )
}
