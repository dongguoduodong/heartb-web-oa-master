"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { Toaster } from "sonner"

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        {children}
        <Toaster
          richColors
          position='top-center'
          toastOptions={{
            classNames: {
              toast: `font-mono border-default-200`,
              title: "text-sm",
              actionButton: `bg-primary text-primary-foreground`,
              cancelButton: `bg-default-200 text-default-foreground`,
            },
          }}
        />
      </NextThemesProvider>
    </NextUIProvider>
  )
}
