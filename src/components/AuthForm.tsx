import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useLocation } from "wouter";
import { User, Building, Briefcase, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { COUNTRIES, BUSINESS_TYPES } from '@/constants/formData';

declare global {
  interface Window {
    intlTelInput: any;
    intlTelInputUtils: any;
  }
}

const AuthForm = () => {
  const { signUp, signIn, user } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load intl-tel-input scripts and initialize
  useEffect(() => {
    if (isSignUp) {
      // Load CSS
      if (!document.querySelector('link[href*="intlTelInput"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/css/intlTelInput.min.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!window.intlTelInput) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/intlTelInput.min.js';
        script.onload = () => {
          const utilsScript = document.createElement('script');
          utilsScript.src = 'https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/utils.js';
          utilsScript.onload = () => {
            initializePhoneInput();
          };
          document.head.appendChild(utilsScript);
        };
        document.head.appendChild(script);
      } else {
        initializePhoneInput();
      }
    }

    return () => {
      if (itiRef.current) {
        try {
          itiRef.current.destroy();
          itiRef.current = null;
        } catch (e) {
          console.warn('Error destroying intl-tel-input:', e);
        }
      }
    };
  }, [isSignUp]);

  const initializePhoneInput = () => {
    if (phoneInputRef.current && window.intlTelInput && !itiRef.current) {
      itiRef.current = window.intlTelInput(phoneInputRef.current, {
        initialCountry: "in",
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/utils.js"
      });

      // Handle phone input formatting
      const handlePhoneInput = () => {
        if (!phoneInputRef.current || !itiRef.current) return;
        
        let numbers = phoneInputRef.current.value.replace(/\D/g, '');
        let countryData = itiRef.current.getSelectedCountryData();
        let maxLen = 15;
        
        if (window.intlTelInputUtils && countryData.iso2) {
          try {
            let exampleNumber = window.intlTelInputUtils.getExampleNumber(
              countryData.iso2, 
              true, 
              window.intlTelInputUtils.numberType.MOBILE
            );
            if (exampleNumber) {
              let digits = exampleNumber.replace(/^\+\d+\s?/, '').replace(/\D/g, '');
              maxLen = digits.length;
            }
          } catch (e) {
            // Fallback to default max length
          }
        }
        
        numbers = numbers.slice(0, maxLen);
        phoneInputRef.current.value = numbers;
        setPhone(numbers);
      };

      phoneInputRef.current.addEventListener('input', handlePhoneInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // Additional validation for signup
      if (!firstName || !lastName || !companyName || !jobTitle || !country || !businessType) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Validate phone number - must be at least 7 digits
      if (!phone || phone.length < 7) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        const metadata = {
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
          job_title: jobTitle,
          phone,
          country,
          business_type: businessType
        };
        
        const result = await signUp(email, password, metadata);
        if (result.error) throw result.error;
        
        if (result.needsEmailConfirmation) {
          toast({
            title: "Check Your Email",
            description: result.message || "Please check your email and click the confirmation link to complete your signup.",
          });
        } else {
          toast({
            title: "Sign Up Successful",
            description: "You have successfully signed up. Redirecting...",
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        toast({
          title: "Sign In Successful",
          description: "You have successfully signed in. Redirecting...",
        });
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate. Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
    // Reset all form fields
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setJobTitle('');
    setPhone('');
    setCountry('');
    setBusinessType('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    
    // Cleanup intl-tel-input when switching forms
    if (itiRef.current) {
      try {
        itiRef.current.destroy();
        itiRef.current = null;
      } catch (e) {
        console.warn('Error destroying intl-tel-input:', e);
      }
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet" />
      <div
        style={{
          backgroundColor: "var(--bg-color)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "'Fredoka One', cursive, sans-serif",
        }}
      >
        <style>{`
          :root {
            --input-focus: #666;
            --font-color: #323232;
            --font-color-sub: #666;
            --bg-color: #fff;
            --bg-color-alt: #666;
            --main-color: #323232;
          }
          body[data-theme="light"] {
            --input-focus: #666;
            --font-color: #111;
            --font-color-sub: #555;
            --bg-color: #fefefe;
            --bg-color-alt: #e5e5e5;
            --main-color: #111;
          }
          .flip-card__back {
            width: 550px;
            min-width: 320px;
            max-width: 95vw;
            height: auto;
            padding: 20px 18px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: var(--bg-color);
            gap: 16px;
            border-radius: 5px;
            border: 2px solid var(--main-color);
            box-shadow: 4px 4px var(--main-color);
            color: var(--font-color);
            box-sizing: border-box;
            margin: 0 auto;
          }
          .title {
            margin: 20px 0;
            font-size: 25px;
            font-weight: 900;
            text-align: center;
            color: var(--main-color);
          }
          form {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 100%;
          }
          .row-top {
            display: flex;
            gap: 12px;
            justify-content: center;
            width: 100%;
          }
          .phone-country-row {
            display: flex;
            gap: 12px;
            justify-content: center;
            width: 100%;
            align-items: center;
          }
          .flip-card__input, .phone-number {
            height: 40px;
            border-radius: 5px;
            border: 2px solid var(--main-color);
            background-color: var(--bg-color);
            box-shadow: 4px 4px var(--main-color);
            font-size: 15px;
            font-weight: 600;
            color: var(--font-color);
            padding: 5px 10px 5px 40px;
            outline: none;
            box-sizing: border-box;
            flex: 1;
            min-width: 0;
            max-width: 250px;
          }
          
          .input-container {
            position: relative;
            flex: 1;
            min-width: 0;
            max-width: 250px;
          }
          
          .input-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--font-color-sub);
            z-index: 1;
            pointer-events: none;
          }
          
          .password-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--font-color-sub);
            cursor: pointer;
            z-index: 1;
          }
          
          .password-toggle:hover {
            color: var(--font-color);
          }
          
          .phone-input-container .flip-card__input,
          .phone-input-container .phone-number {
            padding: 5px 10px;
          }
          .flip-card__input::placeholder, .phone-number::placeholder {
            color: var(--font-color-sub);
            opacity: 0.8;
          }
          .flip-card__input:focus, .phone-number:focus {
            border: 2px solid var(--input-focus);
            outline: none;
          }
          .button-confirm {
            margin: 18px auto 6px auto;
            width: 120px;
            height: 40px;
            border-radius: 5px;
            border: 2px solid var(--main-color);
            background-color: var(--bg-color);
            box-shadow: 4px 4px var(--main-color);
            font-size: 17px;
            font-weight: 600;
            color: var(--font-color);
            cursor: pointer;
            display: block;
            transition: transform 0.1s, box-shadow 0.1s;
          }
          .button-confirm:active {
            box-shadow: 0 0 var(--main-color);
            transform: translate(3px, 3px);
          }
          .button-confirm:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .signin-signup-link {
            text-align: center;
            margin-top: 2px;
            margin-bottom: 2px;
            font-size: 16px;
          }
          .signin-signup-link span {
            color: #666;
            font-weight: 700;
            cursor: pointer;
            text-decoration: underline;
          }
          @media (max-width: 700px) {
            .flip-card__back {
              width: 98vw;
              min-width: 0;
              padding: 12px;
            }
            .button-confirm {
              width: 100%;
            }
          }
          /* Fix intl-tel-input dropdown for both themes */
          .iti__country-list,
          .iti__country,
          .iti__search-input,
          .iti__country-name {
            background-color: var(--bg-color) !important;
            color: var(--font-color) !important;
            border-color: var(--main-color) !important;
          }
          .iti__country.iti__highlight,
          .iti__country.iti__highlight .iti__country-name {
            background-color: var(--bg-color-alt) !important;
            color: var(--font-color) !important;
          }
          .iti__divider {
            border-top: 1px solid var(--main-color) !important;
          }
          .iti__search-input {
            border: 1px solid var(--main-color) !important;
          }
          
          /* Style custom dropdown to match form inputs */
          .custom-dropdown-container {
            height: 40px;
            border-radius: 5px;
            border: 2px solid var(--main-color);
            background-color: var(--bg-color);
            box-shadow: 4px 4px var(--main-color);
            font-size: 15px;
            font-weight: 600;
            color: var(--font-color);
            padding: 5px 10px;
            outline: none;
            box-sizing: border-box;
            flex: 1;
            min-width: 0;
            max-width: 250px;
            display: flex;
            align-items: center;
            cursor: pointer;
          }
          
          .custom-dropdown-container:focus {
            border: 2px solid var(--input-focus);
            outline: none;
          }
        `}</style>

        {isSignUp ? (
          <div className="flip-card__back" role="region" aria-label="Sign up form">
            <h1 className="title">Sign up</h1>
            <form onSubmit={handleSubmit}>
              <div className="row-top">
                <div className="input-container">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    placeholder="First Name"
                    className="flip-card__input"
                    aria-label="First Name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="input-container">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="flip-card__input"
                    aria-label="Last Name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="row-top">
                <div className="input-container">
                  <Building className="input-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Company Name"
                    className="flip-card__input"
                    aria-label="Company Name"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="input-container">
                  <Briefcase className="input-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Job Title"
                    className="flip-card__input"
                    aria-label="Job Title"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="row-top">
                <div className="input-container">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    placeholder="Email"
                    className="flip-card__input"
                    aria-label="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {/* Phone input without icon as requested */}
                <div className="phone-input-container" style={{ flex: 1, minWidth: 0, maxWidth: 250 }}>
                  <input
                    ref={phoneInputRef}
                    id="phone"
                    type="tel"
                    name="phone"
                    className="phone-number"
                    aria-label="Phone number"
                    required
                  />
                </div>
              </div>
              <div className="row-top">
                <div className="input-container">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="flip-card__input"
                    aria-label="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {showPassword ? (
                    <EyeOff 
                      className="password-toggle" 
                      size={18} 
                      onClick={() => setShowPassword(false)}
                    />
                  ) : (
                    <Eye 
                      className="password-toggle" 
                      size={18} 
                      onClick={() => setShowPassword(true)}
                    />
                  )}
                </div>
                <div className="input-container">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    className="flip-card__input"
                    aria-label="Confirm password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {showConfirmPassword ? (
                    <EyeOff 
                      className="password-toggle" 
                      size={18} 
                      onClick={() => setShowConfirmPassword(false)}
                    />
                  ) : (
                    <Eye 
                      className="password-toggle" 
                      size={18} 
                      onClick={() => setShowConfirmPassword(true)}
                    />
                  )}
                </div>
              </div>
              <div className="phone-country-row" aria-label="Country and business type selection">
                <div style={{ flex: 1, minWidth: 0, maxWidth: 250 }}>
                  <CustomDropdown
                    options={[
                      { value: "", label: "Select country" },
                      ...COUNTRIES.map((c) => ({
                        value: c.code,
                        label: c.name,
                      })),
                    ]}
                    placeholder="Select country"
                    value={country}
                    onChange={setCountry}
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, maxWidth: 250 }}>
                  <CustomDropdown
                    options={[
                      { value: "", label: "Select business type" },
                      ...BUSINESS_TYPES.map((b) => ({
                        value: b.toLowerCase().replace(/\s+/g, "-"),
                        label: b,
                      })),
                    ]}
                    placeholder="Select business type"
                    value={businessType}
                    onChange={setBusinessType}
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="button-confirm" 
                aria-label="Confirm sign up"
                disabled={loading}
              >
                {loading ? "Loading..." : "Confirm!"}
              </button>
            </form>
            <div className="signin-signup-link">
              Existing user? <span onClick={handleToggle}>Sign in</span>
            </div>
          </div>
        ) : (
          <div className="flip-card__back" role="region" aria-label="Sign in form">
            <h1 className="title">Sign in</h1>
            <form onSubmit={handleSubmit}>
              <div className="row-top">
                <div className="input-container">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    placeholder="Email"
                    className="flip-card__input"
                    aria-label="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="row-top">
                <div className="input-container">
                  <Lock className="input-icon" size={18} />
                  <input
                    type="password"
                    placeholder="Password"
                    className="flip-card__input"
                    aria-label="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="button-confirm" 
                aria-label="Sign in"
                disabled={loading}
              >
                {loading ? "Loading..." : "Let's go!"}
              </button>
            </form>
            <div className="signin-signup-link">
              New user? <span onClick={handleToggle}>Sign up</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AuthForm;
