import SettingsPage from "../../features/onboarding-settings/SettingsPage";

export const metadata = {
  title: "ALAIN · Settings",
  description: "Manage environment providers, models, appearance, and onboarding presets for your workspace.",
};

export default function SettingsRoute() {
  return <SettingsPage />;
}
