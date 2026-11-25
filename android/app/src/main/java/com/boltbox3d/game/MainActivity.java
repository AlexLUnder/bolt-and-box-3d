package com.boltbox3d.game;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Clean system bar handling for Android 15/16 + Galaxy Z Fold (cover & unfolded)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.parseColor("#E8F4FE"));
        getWindow().setNavigationBarColor(Color.parseColor("#172554"));

        View content = findViewById(android.R.id.content);
        if (content != null) {
            ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
                Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
        }

        // Route Android Back gesture/button to JS so modals close -> gameplay returns Home -> Home minimizes cleanly
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    moveTaskToBack(true);
                    return;
                }
                getBridge().getWebView().evaluateJavascript(
                    "(function(){ return window.__handleAndroidBack ? window.__handleAndroidBack() : 'exit'; })()",
                    value -> {
                        if (value == null || value.contains("exit")) {
                            moveTaskToBack(true);
                        }
                    }
                );
            }
        });
    }

    @Override
    public void onPause() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "window.__setAppPaused && window.__setAppPaused(true);",
                null
            );
        }
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().evaluateJavascript(
                "window.__setAppPaused && window.__setAppPaused(false);",
                null
            );
        }
    }
}
