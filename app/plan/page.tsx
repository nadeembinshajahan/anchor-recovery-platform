import type { Metadata } from "next";
import PlanForm from "./PlanForm";

export const metadata: Metadata = {
  title: "My safety plan",
  description:
    "Create a locally stored safety plan that can personalize support, with clear controls over what may be shared with Gemini.",
};

export default function PlanPage() {
  return (
    <div className="route-page route-page-plan mx-auto max-w-4xl">
      <header className="route-intro route-intro-plan">
        <div className="route-intro-copy">
          <p className="eyebrow">Personalization</p>
          <h1>My safety plan</h1>
          <p className="route-intro-lede">
            A few details make your SOS scripts and tap-to-talk replies personal — your
            name, your go-to coping tools, the person you trust. Your plan is saved on
            this device and can be cleared anytime. When you request personalized AI
            support, your name, recovery focus, trusted person&apos;s name, and coping
            tools may be sent to Google Gemini to create the response.{" "}
            <strong>Your trusted person&apos;s phone number stays on this device.</strong>
          </p>
        </div>
        <div className="route-intro-art plan-intro-art" aria-hidden="true">
          <span className="plan-sun" />
          <span className="plan-shield">
            <i />
          </span>
          <span className="plan-private-note">saved locally</span>
        </div>
      </header>
      <PlanForm />
    </div>
  );
}
