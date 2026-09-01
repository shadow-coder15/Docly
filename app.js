const {useState,useEffect,useRef} = React;

const CONFIG = {
  supabaseUrl: "https://ukjwqevoqsdfnmylxswt.supabase.co",
  supabaseAnonKey: "sb_publishable_1mWGhz0AjDtRhN8rOvx7FA_tZ8Ljb6L",
  freePages: 4,
  freeDocsPerDay: 1
};

const sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

const Icon = {
  Logo: () => React.createElement("svg",{viewBox:"0 0 64 64",fill:"none"},[
    React.createElement("path",{key:"p",d:"M18 8h20l12 12v34H18z",fill:"#fff"}),
    React.createElement("path",{key:"f",d:"M38 8v13h12M25 33h18M25 42h18M25 51h11",stroke:"#0B1220",strokeWidth:"3",strokeLinecap:"round"})
  ]),
  Upload: () => React.createElement("svg",{width:30,height:30,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8},[
    React.createElement("path",{key:"a",d:"M12 16V4m0 0L8 8m4-4 4 4M4 20h16"})
  ]),
  Spark: () => React.createElement("svg",{width:21,height:21,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8},[
    React.createElement("path",{key:"a",d:"M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"}),
    React.createElement("path",{key:"b",d:"M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"})
  ]),
  File: () => React.createElement("svg",{width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8},[
    React.createElement("path",{key:"a",d:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"}),
    React.createElement("path",{key:"b",d:"M14 2v6h6"})
  ]),
  Send: () => React.createElement("svg",{width:19,height:19,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2},[
    React.createElement("path",{key:"a",d:"M22 2 11 13"}),
    React.createElement("path",{key:"b",d:"m22 2-7 20-4-9-9-4 20-7z"})
  ])
};

function Logo(){
  return <div className="logo"><Icon.Logo/></div>;
}

function todayKey(){
  return new Date().toISOString().slice(0,10);
}

function readUsage(){
  try{
    const x=JSON.parse(localStorage.getItem("docly-v2-usage")||"null");
    if(x?.date===todayKey()) return x;
  }catch{}
  return {date:todayKey(),count:0};
}

function estimatePages(b64){
  try{
    const raw=atob(b64);
    const m=raw.match(/\/Type\s*\/Page(?!s)/g);
    return m?.length || null;
  }catch{return null}
}

async function userFromSession(accessToken){
  const r=await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`,{
    headers:{apikey:CONFIG.supabaseAnonKey,Authorization:`Bearer ${accessToken}`}
  });
  if(!r.ok) throw new Error("Your session has expired. Please sign in again.");
  return r.json();
}

async function callAI(contents){
  const r=await fetch("/api/summarize",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({contents})
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error||"Docly couldn't process that document.");
  return data;
}

function parseGist(data){
  if(data?.gist) return data.gist;
  const raw=data?.text||"";
  try{return JSON.parse(raw)}catch{}
  return {
    title:"Document Gist",
    summary:raw,
    points:[],
    important:[],
    tags:[]
  };
}

function Auth({onSignedIn}){
  const [mode,setMode]=useState("signin"),[email,setEmail]=useState(""),[password,setPassword]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");

  async function submit(){
    setError("");setNotice("");
    if(!email.trim()||!password){setError("Enter your email and password.");return}
    if(password.length<6){setError("Password must be at least 6 characters.");return}
    setBusy(true);
    try{
      const endpoint=mode==="signup"
        ? `${CONFIG.supabaseUrl}/auth/v1/signup`
        : `${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`;
      const r=await fetch(endpoint,{
        method:"POST",
        headers:{"Content-Type":"application/json",apikey:CONFIG.supabaseAnonKey},
        body:JSON.stringify({email:email.trim(),password})
      });
      const d=await r.json();
      if(!r.ok) throw new Error(d.msg||d.error_description||d.message||"Authentication failed.");
      if(!d.access_token){
        setNotice("Account created. Check your email to confirm it, then sign in.");
        setMode("signin");
      }else{
        localStorage.setItem("docly-v2-session",d.access_token);
        onSignedIn(await userFromSession(d.access_token));
      }
    }catch(e){setError(e.message||"Something went wrong.")}
    finally{setBusy(false)}
  }

  async function google(){
    setError("");
    const {error:e}=await sb.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin}});
    if(e)setError(e.message);
  }

  return <div className="auth-wrap">
    <div className="card auth">
      <div style={{display:"flex",alignItems:"center",gap:10}}><Logo/><b className="mono">docly</b></div>
      <h1>{mode==="signin"?"Welcome back":"Create your Docly account"}</h1>
      <p>{mode==="signin"?"Turn documents into useful answers.":"Start with one free document a day."}</p>
      <div className="tabs">
        <button className={mode==="signin"?"active":""} onClick={()=>{setMode("signin");setError("");setNotice("")}}>SIGN IN</button>
        <button className={mode==="signup"?"active":""} onClick={()=>{setMode("signup");setError("");setNotice("")}}>SIGN UP</button>
      </div>
      <div className="field"><label>EMAIL</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
      <div className="field"><label>PASSWORD</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="6+ characters"/></div>
      {error&&<div className="error">{error}</div>}
      {notice&&<div className="notice">{notice}</div>}
      <button className="btn btn-primary" style={{width:"100%",marginTop:16}} disabled={busy} onClick={submit}>{busy?"PLEASE WAIT…":mode==="signin"?"SIGN IN":"CREATE ACCOUNT"}</button>
      <div style={{display:"flex",alignItems:"center",gap:10,color:"var(--muted)",fontSize:11,margin:"18px 0"}}><span style={{height:1,background:"var(--line)",flex:1}}/>OR<span style={{height:1,background:"var(--line)",flex:1}}/></div>
      <button className="btn btn-ghost" style={{width:"100%"}} onClick={google}>Continue with Google</button>
    </div>
  </div>
}

function Landing({onStart}){
  return <div>
    <header className="header"><div className="container header-inner">
      <div className="brand"><Logo/><span className="mono">docly</span></div>
      <button className="btn" onClick={onStart}>SIGN IN</button>
    </div></header>
    <main className="container">
      <section className="hero">
        <div className="eyebrow mono">DOCUMENT → GIST</div>
        <h1>Read the point.<br/>Skip the pages.</h1>
        <p>Drop in a PDF. Docly turns it into a clean, useful Gist in seconds — then lets you ask questions about what you uploaded.</p>
        <button className="btn btn-primary" style={{padding:"13px 22px"}} onClick={onStart}>GET STARTED FREE</button>
        <div className="features">
          <div className="feature"><div className="feature-icon"><Icon.Upload/></div><h3 className="mono">01 · UPLOAD</h3><p>Drop a PDF from your phone or computer. No complicated setup.</p></div>
          <div className="feature"><div className="feature-icon"><Icon.Spark/></div><h3 className="mono">02 · GIST</h3><p>Get the main idea, key points and important details without the fluff.</p></div>
          <div className="feature"><div className="feature-icon"><Icon.Send/></div><h3 className="mono">03 · ASK</h3><p>Ask follow-up questions and keep the document as your source of context.</p></div>
        </div>
      </section>
    </main>
    <footer className="footer">Docly — built for readers who don't have time to read it all.</footer>
  </div>
}

function Dashboard({user,onSignOut}){
  const inputRef=useRef(null),[file,setFile]=useState(null),[b64,setB64]=useState(null),[pages,setPages]=useState(null);
  const [gist,setGist]=useState(null),[messages,setMessages]=useState([]),[question,setQuestion]=useState("");
  const [busy,setBusy]=useState(false),[drag,setDrag]=useState(false),[error,setError]=useState("");
  const [usage,setUsage]=useState(readUsage());

  const remaining=Math.max(0,CONFIG.freeDocsPerDay-usage.count);

  function choose(f){
    setError("");setGist(null);setMessages([]);
    if(!f)return;
    if(f.type!=="application/pdf"){setError("PDF files only for now.");return}
    if(f.size>20*1024*1024){setError("That PDF is over 20 MB. Please use a smaller file.");return}
    const reader=new FileReader();
    reader.onload=()=>{const x=String(reader.result).split(",")[1];setFile(f);setB64(x);setPages(estimatePages(x))};
    reader.onerror=()=>setError("Docly couldn't read that file.");
    reader.readAsDataURL(f);
  }

  async function summarize(){
    setError("");
    if(!file||!b64)return;
    if(pages&&pages>CONFIG.freePages){setError(`This document is about ${pages} pages. Free accounts support up to ${CONFIG.freePages} pages.`);return}
    if(usage.count>=CONFIG.freeDocsPerDay){setError("FREE_LIMIT");return}
    setBusy(true);
    try{
      const contents=[{role:"user",parts:[
        {inlineData:{mimeType:"application/pdf",data:b64}},
        {text:"Create a Docly Gist for this PDF. Return ONLY valid JSON matching the requested schema."}
      ]}];
      const data=await callAI(contents);
      setGist(parseGist(data));
      const next={date:todayKey(),count:usage.count+1};
      setUsage(next);localStorage.setItem("docly-v2-usage",JSON.stringify(next));
    }catch(e){setError(e.message||"Failed to generate the Gist.")}
    finally{setBusy(false)}
  }

  async function ask(){
    const q=question.trim();
    if(!q||busy||!gist)return;
    setQuestion("");setError("");setBusy(true);
    const history=[
      {role:"user",parts:[{text:`DOCUMENT GIST:\n${JSON.stringify(gist)}\n\nQuestion: ${q}`}]},
      ...messages.map(m=>({role:m.role==="ai"?"model":"user",parts:[{text:m.text}]}))
    ];
    setMessages(x=>[...x,{role:"user",text:q}]);
    try{
      const data=await callAI(history);
      setMessages(x=>[...x,{role:"ai",text:data.text||JSON.stringify(data.gist||data)}]);
    }catch(e){setError("Couldn't answer that question. Try again.");}
    finally{setBusy(false)}
  }

  function downloadTxt(){
    if(!gist)return;
    const text=[
      `DOCLY GIST — ${gist.title||file?.name||"Document"}`,"",
      gist.summary||"","",
      "KEY POINTS",...(gist.points||[]).map((x,i)=>`${i+1}. ${x}`),"",
      "IMPORTANT",...(gist.important||[]).map(x=>`• ${x}`),"",
      "TAGS",(gist.tags||[]).join(", ")
    ].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));a.download=(file?.name||"docly").replace(/\.pdf$/i,"")+"-gist.txt";a.click();
  }

  return <div className="app">
    <header className="header"><div className="container header-inner">
      <div className="brand"><Logo/><span className="mono">docly</span></div>
      <div className="header-actions">
        <span className="pill mono secondary">{remaining} FREE DOC LEFT</span>
        <button className="pill mono secondary">GHS 2 / 24H</button>
        <button className="btn btn-primary mono">UPGRADE TO PRO</button>
        <button className="btn mono" onClick={onSignOut}>↪</button>
      </div>
    </div></header>

    <main className="container dashboard">
      <div style={{marginBottom:18}}>
        <div className="eyebrow mono">YOUR WORKSPACE</div>
        <h1 style={{fontSize:32,margin:"8px 0 4px",letterSpacing:"-.04em"}}>Turn a document into a Gist.</h1>
        <p style={{margin:0,color:"var(--muted)",fontSize:14}}>Upload once. Understand faster. Ask anything about it.</p>
      </div>

      <div className="dashboard-grid">
        <aside className="card upload-card">
          <div className={"upload-zone"+(drag?" drag":"")}
            onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);choose(e.dataTransfer.files?.[0])}}
            onClick={()=>inputRef.current?.click()}>
            <Icon.Upload/>
            <h3>{file?"PDF READY":"Drop your PDF here"}</h3>
            <p>{file?"Tap to replace it.":"or tap to choose a file from your device"}</p>
            <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={e=>choose(e.target.files?.[0])}/>
          </div>
          {file&&<div className="file-chip">
            <Icon.File/><div style={{minWidth:0}}><div className="name">{file.name}</div><div className="meta">{pages?`~${pages} pages · `:""}{(file.size/1024/1024).toFixed(1)} MB</div></div>
          </div>}
          {error==="FREE_LIMIT" ? <div className="notice">You've used today's free document. Upgrade or use a 24-hour pass to continue.</div> : error&&<div className="error">{error}</div>}
          <button className="btn btn-primary" style={{width:"100%",marginTop:14}} disabled={!file||busy} onClick={summarize}>
            {busy?<span className="loading"><span className="spinner"/>BUILDING GIST…</span>:<><Icon.Spark/> SUMMARIZE</>}
          </button>
          <div style={{marginTop:14,color:"var(--muted)",fontSize:11,lineHeight:1.5}}>Free: {CONFIG.freePages} pages · {CONFIG.freeDocsPerDay} document/day</div>
        </aside>

        <section className="card result">
          {!gist ? <div className="result-empty"><div>
            <Icon.Spark/><h2>Your Gist will appear here.</h2><p>Instead of a wall of AI text, Docly will organize the document into a quick overview, key points and important details.</p>
          </div></div> :
          <div>
            <div className="gist-head">
              <div className="gist-kicker mono">DOCUMENT GIST</div>
              <div className="gist-title">{gist.title||file?.name}</div>
              <div className="gist-sub">{file?.name}{pages?` · approximately ${pages} pages`:""}</div>
            </div>
            <div className="gist-body">
              <div className="summary-box"><h3 className="mono">TL;DR</h3><p>{gist.summary}</p></div>
              <div className="summary-box"><h3 className="mono">KEY POINTS</h3>
                <ol className="points">{(gist.points||[]).map((x,i)=><li className="point" key={i}><span className="point-num">{i+1}</span><p>{x}</p></li>)}</ol>
              </div>
              {(gist.important||[]).length>0&&<div className="summary-box"><h3 className="mono">IMPORTANT TO KNOW</h3><ul className="points">{gist.important.map((x,i)=><li className="point" key={i}><span className="point-num">!</span><p>{x}</p></li>)}</ul></div>}
              {(gist.tags||[]).length>0&&<div className="tags">{gist.tags.map((x,i)=><span className="tag" key={i}>#{x}</span>)}</div>}
              <div className="actions"><button className="btn" onClick={downloadTxt}>EXPORT TXT</button><button className="btn" onClick={()=>{setGist(null);setMessages([])}}>NEW DOCUMENT</button></div>

              <div className="chat">
                <h3 className="mono">ASK DOCLY</h3>
                <div className="chat-log">{messages.length===0&&<div style={{color:"var(--muted)",fontSize:12}}>Try: “What are the main risks?” or “Explain this like I'm new to the topic.”</div>}
                  {messages.map((m,i)=><div key={i} className={"msg "+(m.role==="user"?"user":"ai")}>{m.text}</div>)}
                </div>
                <div className="chat-row"><input className="chat-input" value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ask something about this document…"/><button className="btn btn-primary chat-send" disabled={busy||!question.trim()} onClick={ask}><Icon.Send/></button></div>
              </div>
            </div>
          </div>}
        </section>
      </div>
    </main>
    <footer className="footer">Docly v2 foundation · document → Gist → answers</footer>
  </div>
}

function App(){
  const [view,setView]=useState("landing"),[user,setUser]=useState(null),[ready,setReady]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const {data}=await sb.auth.getSession();
        if(data?.session?.access_token){
          const u=await userFromSession(data.session.access_token);setUser(u);setView("dashboard");
        }else{
          const token=localStorage.getItem("docly-v2-session");
          if(token){const u=await userFromSession(token);setUser(u);setView("dashboard")}
        }
      }catch{localStorage.removeItem("docly-v2-session")}
      finally{setReady(true)}
    })();
  },[]);

  function signedIn(u){setUser(u);setView("dashboard")}
  function signOut(){localStorage.removeItem("docly-v2-session");sb.auth.signOut().catch(()=>{});setUser(null);setView("landing")}

  if(!ready)return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",color:"var(--muted)"}}>Loading Docly…</div>;
  if(!user)return view==="auth"?<Auth onSignedIn={signedIn}/>:<Landing onStart={()=>setView("auth")}/>;
  return <Dashboard user={user} onSignOut={signOut}/>;
}

try{ReactDOM.createRoot(document.getElementById("root")).render(<App/>)}catch(e){
  const el=document.getElementById("fatal");el.hidden=false;el.textContent="Docly failed to load: "+e.message;
}
