package org.harbor.travel;
import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.webkit.*;
import android.view.*;
import android.widget.FrameLayout;
import java.io.*;
import java.util.*;

public class MainActivity extends Activity {
 private static final String LOCAL="https://appassets.androidplatform.net";
 private WebView web;
 private ValueCallback<Uri[]> fileCallback;
 private GeolocationPermissions.Callback locationCallback;
 private String locationOrigin;
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  FrameLayout root=new FrameLayout(this);
  web=new WebView(this);
  root.addView(web,new FrameLayout.LayoutParams(-1,-1));
  setContentView(root);
  root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener(){ public WindowInsets onApplyWindowInsets(View v,WindowInsets insets){
   if(Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);}
   else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
   return insets;
  }});
  WebSettings settings=web.getSettings();
  settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);
  settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  settings.setGeolocationEnabled(true);
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
    Uri uri=request.getUrl();
    if(!"appassets.androidplatform.net".equals(uri.getHost()))return null;
    String path=uri.getPath();
    if(path==null||!path.startsWith("/app/")||path.contains(".."))return missing();
    if(path.endsWith("/"))path+="index.html";
    try{
     InputStream stream=getAssets().open(path.substring(1));
     String mime=mimeType(path);
     Map<String,String> headers=new HashMap<>();headers.put("Access-Control-Allow-Origin",LOCAL);headers.put("X-Content-Type-Options","nosniff");
     return new WebResourceResponse(mime,"UTF-8",200,"OK",headers,stream);
    }catch(IOException e){return missing();}
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
    Uri uri=request.getUrl();String scheme=uri.getScheme();
    if("https".equals(scheme)&&"appassets.androidplatform.net".equals(uri.getHost())&&uri.getPath()!=null&&uri.getPath().startsWith("/app/"))return false;
    if(!Arrays.asList("https","tel","sms","mailto","geo").contains(scheme))return true;
    if("appassets.androidplatform.net".equals(uri.getHost()))return true;
    try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}
    return true;
   }
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
    if(fileCallback!=null)fileCallback.onReceiveValue(null);
    fileCallback=callback;
    Intent intent=new Intent(Intent.ACTION_GET_CONTENT);intent.setType("image/*");intent.addCategory(Intent.CATEGORY_OPENABLE);
    try{startActivityForResult(Intent.createChooser(intent,"Choose a photo"),50);}catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;}
    return true;
   }
   @Override public void onGeolocationPermissionsShowPrompt(String origin,GeolocationPermissions.Callback callback){
    if(!LOCAL.equals(origin)&&!(LOCAL+"/").equals(origin)){callback.invoke(origin,false,false);return;}
    if(checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED){callback.invoke(origin,true,false);return;}
    locationCallback=callback;locationOrigin=origin;
    requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},51);
   }
  });
  if(state!=null)web.restoreState(state);else web.loadUrl(LOCAL+"/app/index.html");
 }
 static String mimeType(String p){if(p.endsWith(".html"))return "text/html";if(p.endsWith(".css"))return "text/css";if(p.endsWith(".js")||p.endsWith(".mjs"))return "text/javascript";if(p.endsWith(".json"))return "application/json";if(p.endsWith(".webmanifest"))return "application/manifest+json";if(p.endsWith(".svg"))return "image/svg+xml";if(p.endsWith(".png"))return "image/png";if(p.endsWith(".wasm"))return "application/wasm";return "application/octet-stream";}
 static WebResourceResponse missing(){return new WebResourceResponse("text/plain","UTF-8",404,"Not found",Collections.emptyMap(),new ByteArrayInputStream("Not found".getBytes()));}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==50&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileCallback=null;}}
 @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code==51&&locationCallback!=null){boolean allowed=false;for(int r:results)allowed|=r==PackageManager.PERMISSION_GRANTED;locationCallback.invoke(locationOrigin,allowed,false);locationCallback=null;}}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onSaveInstanceState(Bundle out){web.saveState(out);super.onSaveInstanceState(out);}
 @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);web.destroy();super.onDestroy();}
}
