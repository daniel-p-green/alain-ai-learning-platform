import OnboardingWizard from "../../features/onboarding-settings/OnboardingWizard";

export const metadata = {
  title: "ALAIN - Onboarding",
};

export default function OnboardingPage() {
  return (
    <div className="bg-paper-0 min-h-screen">
      <OnboardingWizard />
    </div>
  );
}
