import React, { useState } from "react";
import {images} from '../../constants';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useNavigate,Link } from "react-router-dom";
import axios from 'axios';


const Login = () => {

  const [showPassword, setShowPassword] = useState(false);
  const [name,setName] = useState();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [confirmPass, setConfirmPass] = useState();
  const navigate = useNavigate();

  const togglePassword =()=>{
    setShowPassword((prev)=>!prev);
  }

  const handleSubmit=(e)=>{
    e.preventDefault();

      if (password !== confirmPass) {
    alert("Passwords do not match!");
    return;
  }

    axios.post('http://localhost/Readora_API/api/register.php',{name,email,password})
    .then(result=>{ console.log(result)
      navigate('/login');
    })
    .catch(err=>console.log(err))
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-center container">
            <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-red-500 clip-wave_2"></div>
      </div>
      <div className="bg-white flex flex-col justify-center items-center px-12 py-10 rounded-md gap-1 shadow-lg w-auto z-10">
        <div className="login__logo text-center">
          <img src={images.logo} alt="logo" className="w-60 text-center" />
        </div>
        <div className="login__detail  text-center">
          <h2 className="text-[#4D4D4D]">Registration</h2>
          <p className="text-[#ABABAB] text-sm my-1">
            For the wonderer lost in life
          </p>
          <div className="login__detail-logink text-start mt-8">
           <form onSubmit={handleSubmit}>
             <div className="login__detail-login_name text-[#4D4D4D]">
              <label className="text-sm font-semibold">Name </label>
              <input
                className="w-full mt-1 border border-[#DCD9D9] px-2 rounded py-1"
                type="text"
                name="name"
                onChange={(e)=> setName(e.target.value)}
                required
              />
            </div>
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
                          <div className="login__detail-login_password mt-2 relative">
              <label className="text-sm font-semibold">Confirm Password </label>
              <input
                className="w-full mt-1 border border-[#DCD9D9] px-2 rounded py-1"
                type={showPassword ? 'text' : 'password'}
                name="confirmpassword"
                onChange={(e)=> setConfirmPass(e.target.value)}
                required
              />
               <span
                className="absolute right-2 top-[34px] text-gray-600 cursor-pointer"
                onClick={togglePassword}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>
                        <button
              className="w-full bg-[#FA7C54] text-white mt-5 py-2 rounded text-center flex justify-center"
              type="submit"
            >
              Register
            </button>
           </form>
            <div className="login__detail-register text-[#4D4D4D] mt-5 flex justify-between text-sm ">
              <div className="login__detail-register-new">
                <p>Already a User?</p>
                <a href="/login" className="underline">
                  login now
                </a>
              </div>
              <div className="login__detail-register-guest underline">
  <Link to="/">Use as Guest</Link>
</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
