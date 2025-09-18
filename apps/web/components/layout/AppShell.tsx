import type { ReactNode } from "react";
import { PageContainer } from "./PageContainer";

export type AppShellProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: "left" | "right";
  gapClassName?: string;
  stackClassName?: string;
  mainClassName?: string;
  paddingX?: Parameters<typeof PageContainer>[0]["paddingX"];
  paddingY?: Parameters<typeof PageContainer>[0]["paddingY"];
  maxWidth?: Parameters<typeof PageContainer>[0]["maxWidth"];
  containerClassName?: string;
};

export function AppShell({
  children,
  sidebar,
  sidebarPosition = "right",
  gapClassName = "gap-6",
  stackClassName,
  mainClassName,
  paddingX,
  paddingY,
  maxWidth = "wide",
  containerClassName,
}: AppShellProps) {
  const hasSidebar = Boolean(sidebar);

  return (
    <PageContainer
      maxWidth={maxWidth}
      paddingX={paddingX}
      paddingY={paddingY}
      className={containerClassName}
    >
      {hasSidebar ? (
        <div
          className={[
            "grid w-full",
            gapClassName,
            "lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]",
            stackClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {sidebarPosition === "left" && sidebar && (
            <div className="order-1 lg:order-none">{sidebar}</div>
          )}
          <div
            className={[
              "flex flex-col gap-6",
              sidebarPosition === "left" ? "order-2 lg:order-none" : "order-1 lg:order-none",
              mainClassName,
            ].join(" ")}
          >
            {children}
          </div>
          {sidebarPosition === "right" && sidebar && (
            <div className="order-2 lg:order-none">{sidebar}</div>
          )}
        </div>
      ) : (
        <div className={["flex flex-col", gapClassName, stackClassName].filter(Boolean).join(" ")}>{children}</div>
      )}
    </PageContainer>
  );
}
