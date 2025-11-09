package com.myney.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Environment;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;

import java.io.File;
import java.io.IOException;

public class OverlayService extends Service {

    private WindowManager windowManager;
    private View overlayView;
    private WindowManager.LayoutParams params;

    private MediaRecorder recorder;
    private String outputFile;

    private int screenHeight;

    @Override
    public void onCreate() {
        super.onCreate();

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);

        // Inflate layout
        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_button, null);

        // Lấy chiều cao màn hình
        DisplayMetrics metrics = new DisplayMetrics();
        windowManager.getDefaultDisplay().getMetrics(metrics);
        screenHeight = metrics.heightPixels;

        // Set layout params
        int layoutFlag;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
        }

        params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 100; // Vị trí ban đầu
        params.y = 300;

        // Add view
        windowManager.addView(overlayView, params);

        Button btn = overlayView.findViewById(R.id.btnOverlay);

        // 👇 Listener gộp kéo + ghi âm
        btn.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;
            private boolean isDragging = false;
            private boolean isRecording = false;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        isDragging = false;

                        // Bắt đầu ghi âm
                        startRecording();
                        isRecording = true;
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        int dx = (int) (event.getRawX() - initialTouchX);
                        int dy = (int) (event.getRawY() - initialTouchY);

                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                            isDragging = true;
                            params.x = initialX + dx;
                            params.y = initialY + dy;
                            windowManager.updateViewLayout(overlayView, params);
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        if (isRecording) {
                            stopRecording();
                            isRecording = false;
                        }

                        if (isDragging) {
                            // Nếu kéo nút xuống gần cạnh dưới → xoá
                            if (params.y > screenHeight - 300) { 
                                windowManager.removeView(overlayView);
                                stopSelf();
                            }
                        } else {
                            v.performClick(); // click bình thường
                        }
                        return true;
                }
                return false;
            }
        });
    }

    private void startRecording() {
        try {
            File dir = new File(getExternalFilesDir(Environment.DIRECTORY_MUSIC), "MyRecordings");
            if (!dir.exists()) dir.mkdirs();

            outputFile = new File(dir, "REC_" + System.currentTimeMillis() + ".mp3").getAbsolutePath();

            recorder = new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setOutputFile(outputFile);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.prepare();
            recorder.start();

            Log.i("OverlayService", "Recording started: " + outputFile);
        } catch (IOException e) {
            Log.e("OverlayService", "Recording failed", e);
        } catch (Exception e) {
            Log.e("OverlayService", "Unexpected error", e);
        }
    }

    private void stopRecording() {
        try {
            if (recorder != null) {
                recorder.stop();
                recorder.release();
                recorder = null;
                Log.i("OverlayService", "Recording saved: " + outputFile);
            }
        } catch (Exception e) {
            Log.e("OverlayService", "Stop recording failed", e);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (overlayView != null) {
            windowManager.removeView(overlayView);
        }
        if (recorder != null) {
            recorder.release();
            recorder = null;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
