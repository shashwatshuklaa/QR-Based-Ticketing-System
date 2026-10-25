/**
 * Dynamically loads the official Razorpay Checkout SDK script (https://checkout.razorpay.com/v1/checkout.js)
 * Resolves to true once window.Razorpay is available, or false if network fails.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
