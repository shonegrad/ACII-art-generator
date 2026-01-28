"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      visibleToasts={1}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "group toast w-full flex justify-center items-center gap-2 p-2 !bg-transparent !border-0 !shadow-none text-muted-foreground text-xs font-mono",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          title: "font-normal",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
