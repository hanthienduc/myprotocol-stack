"use client";

import { useState, useEffect, useCallback } from "react";
import {
  savePushSubscription,
  removePushSubscription,
  type PushSubscriptionInput,
} from "@/actions/push-subscription";

type PushNotificationState = {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | "default";
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook for managing push notification subscriptions.
 * Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY env var.
 */
export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: "default",
    isLoading: true,
    error: null,
  });

  // Check initial state
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = "serviceWorker" in navigator && "PushManager" in window;

      if (!isSupported) {
        setState((prev) => ({ ...prev, isSupported: false, isLoading: false }));
        return;
      }

      const permission = Notification.permission;

      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          permission,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error("[Push] Error checking subscription:", err);
        setState({
          isSupported: true,
          isSubscribed: false,
          permission,
          isLoading: false,
          error: "Failed to check subscription status",
        });
      }
    };

    checkSupport();
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      return registration;
    } catch (err) {
      console.error("[Push] Service worker registration failed:", err);
      return null;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          permission,
          isLoading: false,
          error: "Notification permission denied",
        }));
        return false;
      }

      // Register/get service worker
      let registration = await navigator.serviceWorker.ready;
      if (!registration) {
        registration = (await registerServiceWorker()) as ServiceWorkerRegistration;
        if (!registration) {
          throw new Error("Failed to register service worker");
        }
      }

      // Get VAPID public key from env
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Save to database
      const subscriptionJson = subscription.toJSON();
      const input: PushSubscriptionInput = {
        endpoint: subscriptionJson.endpoint!,
        keys: {
          p256dh: subscriptionJson.keys!.p256dh!,
          auth: subscriptionJson.keys!.auth!,
        },
      };

      const result = await savePushSubscription(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to save subscription");
      }

      setState({
        isSupported: true,
        isSubscribed: true,
        permission: "granted",
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      console.error("[Push] Subscribe error:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, [registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from database
        await removePushSubscription(subscription.endpoint);
        // Unsubscribe from browser
        await subscription.unsubscribe();
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      console.error("[Push] Unsubscribe error:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

// Helper: Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
