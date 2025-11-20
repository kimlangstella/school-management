"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

type DemoStudent = { code: string; first_name: string; last_name: string };
type Status = "present" | "late" | "absent" | "unmarked";

const DEMO_STUDENTS: DemoStudent[] = [
    { code: "AAA11111", first_name: "CHHAN", last_name: "UDOMSAKADA" },
    { code: "BBB22222", first_name: "CHHAN", last_name: "UDOMVATANA" },
    { code: "CCC33333", first_name: "PHAY", last_name: "NA YUTH" },
    { code: "DDD44444", first_name: "PUTH", last_name: "PICH MOROKOT" },
    { code: "EEE55555", first_name: "LIM", last_name: "HONGKEAT" },
    { code: "FFF66666", first_name: "CHEA", last_name: "KIM ANN" },
];

const SESSIONS = Array.from({ length: 11 }, (_, i) => i + 1);

export default function KioskDemo() {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // ZXing objects held in refs
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    // FIX: Use useRef for debounce instead of 'window' to avoid 'any' errors
    const lastScanRef = useRef<{ code: string; ts: number }>({ code: "", ts: 0 });

    const [cameraOn, setCameraOn] = useState(false);
    const [classroom, setClassroom] = useState("Robotics_PH");
    const [sessionNo, setSessionNo] = useState<number>(1);
    const [sessionDate, setSessionDate] = useState<string>("");

    const [statusByStudent, setStatusByStudent] = useState<Record<string, Status>>({});
    const [log, setLog] = useState<string[]>([]);
    const [manualCode, setManualCode] = useState("");

    // init statuses
    useEffect(() => {
        const init: Record<string, Status> = {};
        DEMO_STUDENTS.forEach((s) => (init[s.code] = "unmarked"));
        setStatusByStudent(init);
    }, []);

    // reset on session change
    useEffect(() => {
        const reset: Record<string, Status> = {};
        DEMO_STUDENTS.forEach((s) => (reset[s.code] = "unmarked"));
        setStatusByStudent(reset);
        setLog([]);
    }, [sessionNo]);

    // Helper function needs to be available to handleScan
    function format(iso: string) {
        return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    }

    // FIX: Wrapped in useCallback for stable dependency in useEffect
    const handleScan = useCallback((raw: string) => {
        const code = raw.startsWith("S:") ? raw.slice(2) : raw;

        // FIX: Use ref for debounce logic
        const now = Date.now();
        if (lastScanRef.current.code === code && now - lastScanRef.current.ts < 2000) {
            return;
        }
        lastScanRef.current = { code, ts: now };

        const student = DEMO_STUDENTS.find((s) => s.code === code);
        if (!student) {
            setLog((l) => [`Unknown code: ${code}`, ...l]);
            beep(false);
            return;
        }

        setStatusByStudent((m) => ({ ...m, [code]: "present" }));
        setLog((l) => [
            `✓ ${student.first_name} ${student.last_name} → Present (S${sessionNo}${sessionDate ? ", " + format(sessionDate) : ""})`,
            ...l,
        ]);
        beep(true);
    }, [sessionNo, sessionDate]);

    // camera start/stop using controls.stop()
    useEffect(() => {
        const stopEverything = () => {
            try {
                controlsRef.current?.stop();
                controlsRef.current = null;
            } catch {}
            const stream = videoRef.current?.srcObject as MediaStream | null;
            stream?.getTracks().forEach((t) => t.stop());
            if (videoRef.current) videoRef.current.srcObject = null;
        };

        if (!cameraOn) {
            stopEverything();
            return;
        }

        readerRef.current = new BrowserMultiFormatReader();

        (async () => {
            try {
                controlsRef.current = await readerRef.current!.decodeFromVideoDevice(
                    undefined,               // auto select camera
                    videoRef.current!,       // <video> target
                    // FIX: Removed unused 'err' parameter
                    (result) => {
                        if (!result) return;
                        const raw = result.getText().trim();
                        handleScan(raw);
                    }
                );
            } catch (e) {
                console.error(e);
                // FIX: Safer error handling than 'as any'
                const msg = e instanceof Error ? e.message : String(e);
                setLog((l) => [`Camera error: ${msg}`, ...l]);
                setCameraOn(false);
                stopEverything();
            }
        })();

        // cleanup on unmount / toggle off
        return () => stopEverything();
    }, [cameraOn, handleScan]); // FIX: Added handleScan to dependencies

    function setStatus(code: string, status: Exclude<Status, "unmarked">) {
        const student = DEMO_STUDENTS.find((s) => s.code === code)!;
        setStatusByStudent((m) => ({ ...m, [code]: status }));
        setLog((l) => [`• ${student.first_name} ${student.last_name} → ${status}`, ...l]);
        beep(status !== "absent");
    }

    function resetDemo() {
        const init: Record<string, Status> = {};
        DEMO_STUDENTS.forEach((s) => (init[s.code] = "unmarked"));
        setStatusByStudent(init);
        setLog([]);
        setSessionDate("");
    }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Attendance Kiosk — DEMO (no database writes)</h1>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <select className="h-10 rounded-md border px-3 bg-default-50" value={classroom} onChange={(e)=>setClassroom(e.target.value)}>
          <option value="Robotics_PH">Robotics_PH</option>
          <option value="Robotics_OCIC">Robotics_OCIC</option>
          <option value="Robotics_Sakura">Robotics_Sakura</option>
        </select>

        <select className="h-10 rounded-md border px-3 bg-default-50" value={sessionNo} onChange={(e)=>setSessionNo(Number(e.target.value))}>
          {SESSIONS.map((n) => <option key={n} value={n}>Session {n}</option>)}
        </select>

        <input
          type="date"
          className="h-10 rounded-md border px-3 bg-default-50"
          value={sessionDate}
          onChange={(e)=>setSessionDate(e.target.value)}
          placeholder="Session date"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCameraOn((v) => !v)}
            className={`h-10 px-4 rounded-md border font-medium ${cameraOn ? "bg-danger text-danger-foreground border-danger" : "bg-primary text-primary-foreground border-primary"}`}
          >
            {cameraOn ? "Stop camera" : "Start camera"}
          </button>
          <button onClick={resetDemo} className="h-10 px-4 rounded-md border bg-default-100">Reset</button>
        </div>
      </div>

      {/* Scanner + manual input */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <video ref={videoRef} className="w-full rounded-lg bg-black/70 aspect-video" autoPlay muted playsInline />
        </div>
        <div className="p-3 rounded-lg border bg-default-50">
          <div className="text-sm font-medium mb-2">Manual code (press Enter)</div>
          <input
            className="w-full h-10 rounded-md border px-3 bg-white"
            placeholder="e.g. S:AAA11111 or AAA11111"
            value={manualCode}
            onChange={(e)=>setManualCode(e.target.value)}
            onKeyDown={(e)=>{ if (e.key === "Enter" && manualCode.trim()) { handleScan(manualCode.trim()); setManualCode(""); } }}
          />
          <div className="mt-3 text-xs opacity-70">
            Demo codes: AAA11111, BBB22222, CCC33333, DDD44444, EEE55555, FFF66666 (with or without “S:”)
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-default-50/60">
          <div className="text-sm font-semibold">
            {classroom} — Session {sessionNo}{sessionDate ? ` (${format(sessionDate)})` : ""}
          </div>
          <div className="text-xs opacity-70">
            Present: {Object.values(statusByStudent).filter((s)=>s==="present").length} / {DEMO_STUDENTS.length}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-background sticky top-0">
            <tr>
              <th className="text-left p-2">Student</th>
              <th className="text-left p-2">Code</th>
              <th className="text-center p-2">Status</th>
              <th className="text-center p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_STUDENTS.map((s, idx) => {
              const st = statusByStudent[s.code] ?? "unmarked";
              return (
                <tr key={s.code} className="border-t">
                  <td className="p-2 whitespace-nowrap">{idx + 1}. {s.first_name} {s.last_name}</td>
                  <td className="p-2 font-mono text-xs opacity-75">{s.code}</td>
                  <td className="p-2 text-center">
                    <span className={[
                      "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                      st==="present" && "bg-success/20 text-success",
                      st==="late"    && "bg-warning/20 text-warning",
                      st==="absent"  && "bg-danger/20 text-danger",
                      st==="unmarked"&& "bg-default-100 text-default-500"
                    ].join(" ")}>{st}</span>
                  </td>
                  <td className="p-2 text-center">
                    <div className="inline-flex items-center gap-1">
                      <Chip active={st==="present"} label="P" title="Present" onClick={()=>setStatus(s.code,"present")} />
                      <Chip active={st==="late"}    label="L" title="Late"    onClick={()=>setStatus(s.code,"late")} />
                      <Chip active={st==="absent"}  label="A" title="Absent"  onClick={()=>setStatus(s.code,"absent")} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent log */}
      <div className="mt-4 rounded-xl border p-3 bg-default-50">
        <div className="text-sm font-semibold mb-1">Recent</div>
        <ul className="text-xs space-y-1 max-h-40 overflow-auto">
          {log.map((line, i) => <li key={i} className="opacity-80">{line}</li>)}
        </ul>
      </div>
    </div>
  );
}

/* small chip */
function Chip({
  active, label, title, onClick,
}: { active: boolean; label: "P" | "L" | "A"; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={[
        "inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-bold",
        active ? "border-transparent text-white" : "border-default-300 text-default-600",
        active && label === "P" && "bg-primary",
        active && label === "L" && "bg-warning",
        active && label === "A" && "bg-danger",
        !active && "bg-default-50 hover:bg-default-100",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function beep(success = true) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = success ? 880 : 220;
    g.gain.value = 0.06;
    o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 120);
  } catch {}
}
