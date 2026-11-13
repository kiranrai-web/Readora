import React, { useState } from "react";
import {images} from '../../constants';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useNavigate,Link } from "react-router-dom";
import axios from 'axios';
import AlertCard from '../../components/alertCard/alertCard';


const Login = () => {

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate()

  const togglePassword =()=>{
    setShowPassword((prev)=>!prev);
  }

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const result = await axios.post(
      "http://localhost/Readora_API/api/login.php",
      { email, password }
    );

    console.log(result.data);

    if (result.data.success) {
      localStorage.setItem("user", JSON.stringify(result.data.user));
      // Redirect to admin panel if user is admin, otherwise to home
      const redirectPath = result.data.user.role === 'admin' ? '/admin' : '/';
      navigate(redirectPath);
    } else {
      setAlert({
        title: 'Unable to sign in',
        message: result.data.message || 'Please check your details and try again.',
      });
    }

  } catch (err) {
    console.error('Error signing in:', err);
    setAlert({
      title: 'Unable to sign in',
      message: err.response?.data?.message || 'Something went wrong. Please try again.',
    });
  }
};
  return (
    <div className="w-full min-h-screen flex justify-center items-center container">
            <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-red-500 clip-wave"></div>
      </div>
      <div className="bg-white flex flex-col justify-center items-center px-12 py-16 rounded-md gap-1 shadow-lg w-auto z-10">
        <div className="login__logo w-full">
          <img src={images.logo} alt="logo" className="w-60" />
        </div>
        <div className="login__detail  text-center">
          <h2 className="text-[#4D4D4D]">Welcome Back !</h2>
          <p className="text-[#ABABAB] text-sm my-2">
            Sign in to continue to yourDigital Library
          </p>
          <div className="login__detail-logink text-start mt-8">
           <form onSubmit={handleSubmit}>
             <div className="login__detail-login_email text-[#4D4D4D]">
              <label className="text-sm font-semibold">Email </label>
              <input
                className="w-full mt-1 border border-[#DCD9D9] px-2 rounded py-1"
                type="email"
                name="email"
                onChange={(e)=> setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login__detail-login_password mt-2 relative">
              <label className="text-sm font-semibold">Password </label>
              <input
                className="w-full mt-1 border border-[#DCD9D9] px-2 rounded py-1"
                type={showPassword ? 'text' : 'password'}
                name="password"
                onChange={(e)=> setPassword(e.target.value)}
                required
              />
               <span
                className="absolute right-2 top-[34px] text-gray-600 cursor-pointer"
                onClick={togglePassword}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>

                        <div className="login__detail-login_forgot text-[#4D4D4D] text-sm flex justify-between mt-6">
              <div className="login__detail-login_forgot-remember">
                <input
                  type="checkbox"
                  className="mx-1 h-3 w-3"
                />
                <label for="accept">Remember me</label>
              </div>
              <div className="login__detail-login_forgot-forgot">
                <button
                  type="button"
                  onClick={() => setAlert({
                    title: 'Forgot your password?',
                    message: 'Please contact a library administrator and provide your account email. They can set a temporary password for you.',
                  })}
                  className="underline"
                >
                  Forgot Password
                </button>
              </div>
            </div>
            <button 
              className="w-full bg-[#FA7C54] text-white mt-5 py-2 rounded text-center flex justify-center"
              type="submit"
            >
              Login
            </button>
           </form>
            <div className="login__detail-register text-[#4D4D4D] mt-5 flex justify-between text-sm ">
              <div className="login__detail-register-new">
                <p>New User?</p>
                <a href="/register" className="underline">
                  Register Here
                </a>
              </div>
             <div className="login__detail-register-guest underline">
  <Link to="/">Use as Guest</Link>
</div>
            </div>
          </div>
          <AlertCard
            title={alert?.title}
            message={alert?.message}
            onClose={() => setAlert(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
