import React from 'react';

const Logo = ({ className = "h-8 w-auto" }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-brand-blue"
            >
                {/* Shield Base */}
                <path
                    d="M16 2L3 7V14C3 22 16 30 16 30C16 30 29 22 29 14V7L16 2Z"
                    fill="currentColor"
                    fillOpacity="0.1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Inner Code Brackets / 'CA' stylized */}
                <path
                    d="M11 11L8 15L11 19M21 11L24 15L21 19"
                    stroke="#ffa116"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M14.5 9L17.5 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                />
            </svg>
            <span className="text-xl font-bold tracking-tight text-white">
                Code<span className="text-brand-blue">Arena</span>
            </span>
        </div>
    );
};

export default Logo;
