"use client";

import { AjoPaySpinner, AjoPaySpinnerCompact } from "@/components/ui/AjoPaySpinner";
import { LoadingSpinner, AdvancedLoadingSpinner } from "@/components/ui/loading-spinner";

export default function SpinnerDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          AjoPay Loading Spinners Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* AjoPay Spinner Variants */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">AjoPay Spinner</h2>
            <div className="space-y-6">
              <div className="text-center">
                <AjoPaySpinner size="sm" showText text="Small Loading..." />
              </div>
              <div className="text-center">
                <AjoPaySpinner size="md" showText text="Medium Loading..." />
              </div>
              <div className="text-center">
                <AjoPaySpinner size="lg" showText text="Large Loading..." />
              </div>
              <div className="text-center">
                <AjoPaySpinner size="xl" showText text="Extra Large Loading..." />
              </div>
            </div>
          </div>

          {/* AjoPay Compact Spinner */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">AjoPay Compact Spinner</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <AjoPaySpinnerCompact size="sm" />
                <span className="text-sm text-gray-600">Small compact spinner</span>
              </div>
              <div className="flex items-center gap-4">
                <AjoPaySpinnerCompact size="md" />
                <span className="text-sm text-gray-600">Medium compact spinner</span>
              </div>
              <div className="flex items-center gap-4">
                <AjoPaySpinnerCompact size="lg" />
                <span className="text-sm text-gray-600">Large compact spinner</span>
              </div>
              <div className="flex items-center gap-4">
                <AjoPaySpinnerCompact size="xl" />
                <span className="text-sm text-gray-600">Extra large compact spinner</span>
              </div>
            </div>
          </div>

          {/* Updated Loading Spinner */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Updated Loading Spinner</h2>
            <div className="space-y-6">
              <div className="text-center">
                <LoadingSpinner size="sm" text="Small" />
              </div>
              <div className="text-center">
                <LoadingSpinner size="md" text="Medium" />
              </div>
              <div className="text-center">
                <LoadingSpinner size="lg" text="Large" />
              </div>
              <div className="text-center">
                <LoadingSpinner size="xl" text="Extra Large" />
              </div>
            </div>
          </div>

          {/* Advanced Loading Spinner */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Advanced Loading Spinner</h2>
            <div className="space-y-6">
              <div className="text-center">
                <AdvancedLoadingSpinner size="sm" text="Small Advanced" />
              </div>
              <div className="text-center">
                <AdvancedLoadingSpinner size="md" text="Medium Advanced" />
              </div>
              <div className="text-center">
                <AdvancedLoadingSpinner size="lg" text="Large Advanced" />
              </div>
              <div className="text-center">
                <AdvancedLoadingSpinner size="xl" text="Extra Large Advanced" />
              </div>
            </div>
          </div>

          {/* Button Examples */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Button Examples</h2>
            <div className="space-y-4">
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2">
                <AjoPaySpinnerCompact size="sm" className="text-white" />
                Processing...
              </button>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
                <AjoPaySpinnerCompact size="sm" className="text-white" />
                Loading...
              </button>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2">
                <AjoPaySpinnerCompact size="sm" className="text-white" />
                Saving...
              </button>
            </div>
          </div>

          {/* Inline Examples */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Inline Examples</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <AjoPaySpinnerCompact size="sm" />
                <span>Loading user data...</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <AjoPaySpinnerCompact size="sm" />
                <span>Syncing with server...</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <AjoPaySpinnerCompact size="sm" />
                <span>Processing payment...</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <AjoPaySpinnerCompact size="sm" />
                <span>Updating profile...</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            All loading spinners now use the AjoPay logo for a consistent brand experience! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
