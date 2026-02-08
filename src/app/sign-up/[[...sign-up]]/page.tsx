"use client";

import { SignUp, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setShowNotice(true);

      const timer = setTimeout(() => {
        router.replace("/");
      }, 900);

      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isLoaded, router]);

  // If already signed in, show a temporary notice before redirecting
  if (isSignedIn && showNotice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-6 text-center animate-fade-in">
          <div className="text-2xl mb-2">🌿</div>
          <h3 className="text-lg font-semibold text-gray-900">
            You&apos;re already signed in
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Redirecting you to Swamp Spotter…
          </p>

          <div className="mt-4 h-1 w-full overflow-hidden rounded bg-gray-100">
            <div className="h-full w-full animate-[loading_1.8s_linear] bg-[#136207]" />
          </div>
        </div>

        <style jsx global>{`
          @keyframes loading {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.25s ease-out;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Normal sign-up page for signed-out users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join <span className="text-[#136207]">Swamp Spotter</span>
          </h2>
          <p className="text-gray-600">
            Create an account to start contributing plant sightings
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl",
            },
          }}
        />
      </div>
    </div>
  );
}
