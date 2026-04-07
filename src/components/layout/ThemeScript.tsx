// Server component — injects a tiny synchronous script into <head>
// so the correct theme class is applied before first paint, preventing flash.
export function ThemeScript() {
  const script = `(function(){
    try{
      var c=document.cookie.match(/(?:^|;\\s*)THEME=([^;]*)/);
      var t=c?decodeURIComponent(c[1]):'system';
      if(t==='system'){
        t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
      }
      if(t==='dark'){document.documentElement.classList.add('dark');}
      else{document.documentElement.classList.remove('dark');}
    }catch(e){}
  })();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
