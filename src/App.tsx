import { useState, useEffect, useRef } from 'react'
import { 
  Activity, 
  Shield, 
  Cpu, 
  Layers, 
  Check, 
  Copy, 
  Download, 
  Mail, 
  ExternalLink, 
  X, 
  HelpCircle,
  BookOpen,
  Server
} from 'lucide-react'
import simlabLogo from './assets/simlab.png'
import frisscoSimlabLogo from './assets/frissco_simlab.png'
import './App.css'



function App() {
  // Navigation & Modals
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [copiedText, setCopiedText] = useState('')



  // 2. Protocol Labs Tabs State
  const [activeLab, setActiveLab] = useState<'arq' | 'csma' | 'tcp'>('arq')

  // ARQ Flow Control States
  const [arqStatus, setArqStatus] = useState<'idle' | 'sending' | 'dropped' | 'ack' | 'timeout'>('idle')
  const [arqPacketProgress, setArqPacketProgress] = useState(0)
  const [arqAckProgress, setArqAckProgress] = useState(0)
  const [arqSeqNum, setArqSeqNum] = useState(0)
  const [arqWillDrop, setArqWillDrop] = useState(false)
  const [arqLogs, setArqLogs] = useState<string[]>(['[ARQ] Click "Send Frame" to start transmission.'])

  // CSMA/CD States
  const [csmaAState, setCsmaAState] = useState<'idle' | 'transmitting' | 'collision' | 'backoff'>('idle')
  const [csmaBState, setCsmaBState] = useState<'idle' | 'transmitting' | 'collision' | 'backoff'>('idle')
  const [csmaTimerA, setCsmaTimerA] = useState(0)
  const [csmaTimerB, setCsmaTimerB] = useState(0)
  const [csmaCollision, setCsmaCollision] = useState(false)
  const [csmaLogs, setCsmaLogs] = useState<string[]>(['[CSMA] Shared medium idle. Transmit nodes to inspect collisions.'])

  // TCP Congestion States
  const [tcpCwnd, setTcpCwnd] = useState(1)
  const [tcpSsthresh, setTcpSsthresh] = useState(16)
  const [tcpPhase, setTcpPhase] = useState<'Slow Start' | 'Congestion Avoidance' | 'Fast Recovery'>('Slow Start')
  const [tcpPoints, setTcpPoints] = useState<{ x: number; y: number; type?: 'loss' | 'timeout' | 'normal' }[]>([
    { x: 0, y: 1 }
  ])
  const [tcpLogs, setTcpLogs] = useState<string[]>(['[TCP] TCP Congestion simulator ready. Increment time steps to grow window.'])

  // 3. Chaos Engineering States
  const [linkFlap, setLinkFlap] = useState(15)
  const [packetLoss, setPacketLoss] = useState(5)
  const [deviceFail, setDeviceFail] = useState(2)
  const [reliabilityScore, setReliabilityScore] = useState(99.999)
  const [mtbfHours, setMtbfHours] = useState(720)
  const [chaosHistory, setChaosHistory] = useState<number[]>([15, 18, 14, 16, 15, 17, 19, 15, 14, 16])

  // 4. Security Terminal States
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'Frissco Security Core v1.0.0 Activation Console',
    'Type "help" for a list of available security inspection routines.',
    ''
  ])
  const [isTampered, setIsTampered] = useState(false)

  // 5. Contact Form States
  const [contactForm, setContactForm] = useState({ name: '', email: '', org: '', message: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)

  // References for Auto-scroll
  const terminalEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight
    }
  }, [terminalLines])



  // ==========================================
  // Protocol Labs Simulator Code
  // ==========================================

  // 1. ARQ Flow Control Animation loop
  const startArqSim = () => {
    if (arqStatus !== 'idle') return
    setArqStatus('sending')
    setArqPacketProgress(0)
    setArqLogs(prev => [...prev, `[ARQ] Transmitting Frame #${arqSeqNum} (SeqNo: ${arqSeqNum % 2}).`])
  }

  const dropNextArq = () => {
    setArqWillDrop(true)
    setArqLogs(prev => [...prev, `[ARQ-Controller] Configured scheduler to inject single packet loss on next frame.`])
  }

  useEffect(() => {
    if (arqStatus !== 'sending') return
    const interval = setInterval(() => {
      setArqPacketProgress(p => {
        if (arqWillDrop && p >= 50) {
          clearInterval(interval)
          setArqStatus('dropped')
          setArqWillDrop(false)
          setArqLogs(logs => [...logs, `[ARQ] ⚠ Packet Collision / Link Drop at 50% link distance. Frame #${arqSeqNum} lost.`])
          
          // Timeout trigger
          setTimeout(() => {
            setArqLogs(logs => [...logs, `[ARQ] Timer Expired (3000ms)! No ACK received. Retransmitting.`])
            setArqStatus('idle')
            setTimeout(() => {
              setArqStatus('sending')
              setArqPacketProgress(0)
              setArqLogs(logs => [...logs, `[ARQ] Retransmitting Frame #${arqSeqNum}.`])
            }, 500)
          }, 2000)

          return p
        }

        if (p >= 100) {
          clearInterval(interval)
          setArqStatus('ack')
          setArqAckProgress(0)
          setArqLogs(logs => [...logs, `[ARQ] Frame #${arqSeqNum} received. Computing checksum... OK. Dispatching ACK.`])
          return 100
        }
        return p + 4
      })
    }, 40)
    return () => clearInterval(interval)
  }, [arqStatus, arqWillDrop])

  useEffect(() => {
    if (arqStatus !== 'ack') return
    const interval = setInterval(() => {
      setArqAckProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setArqStatus('idle')
          setArqLogs(logs => [...logs, `[ARQ] ACK received. Sequence slide successful. Slide window right.`])
          setArqSeqNum(s => s + 1)
          return 100
        }
        return p + 4
      })
    }, 40)
    return () => clearInterval(interval)
  }, [arqStatus])

  // 2. CSMA/CD collision simulation
  const startCsmaSim = (node: 'A' | 'B') => {
    if (node === 'A') {
      if (csmaAState !== 'idle') return
      setCsmaAState('transmitting')
      setCsmaLogs(prev => [...prev, `[CSMA] Node A senses medium: Idle. Starting transmission.`])
    } else {
      if (csmaBState !== 'idle') return
      setCsmaBState('transmitting')
      setCsmaLogs(prev => [...prev, `[CSMA] Node B senses medium: Idle. Starting transmission.`])
    }
  }

  // Handle collision logic
  useEffect(() => {
    if (csmaAState === 'transmitting' && csmaBState === 'transmitting' && !csmaCollision) {
      setCsmaCollision(true)
      setCsmaAState('collision')
      setCsmaBState('collision')
      setCsmaLogs(prev => [
        ...prev,
        `[CSMA] 💥 COLLISION DETECTED on shared bus! Transmitting jam signals...`
      ])

      // Backoff calculator
      setTimeout(() => {
        setCsmaCollision(false)
        const backoffA = Math.floor(Math.random() * 4) + 2
        const backoffB = Math.floor(Math.random() * 4) + 2
        setCsmaTimerA(backoffA)
        setCsmaTimerB(backoffB)
        setCsmaAState('backoff')
        setCsmaBState('backoff')
        setCsmaLogs(prev => [
          ...prev,
          `[CSMA] Backoff algorithm (Exponential): Node A backoff: ${backoffA}s, Node B backoff: ${backoffB}s.`
        ])
      }, 1000)
    }
  }, [csmaAState, csmaBState])

  // Backoff timers countdown
  useEffect(() => {
    let timer: any
    if (csmaAState === 'backoff' && csmaTimerA > 0) {
      timer = setTimeout(() => setCsmaTimerA(t => t - 1), 1000)
    } else if (csmaAState === 'backoff' && csmaTimerA === 0) {
      setCsmaAState('transmitting')
      setCsmaLogs(prev => [...prev, `[CSMA] Node A backoff completed. Retransmitting packet.`])
      setTimeout(() => {
        setCsmaAState('idle')
        setCsmaLogs(prev => [...prev, `[CSMA] Node A packet sent successfully.`])
      }, 1500)
    }
    return () => clearTimeout(timer)
  }, [csmaAState, csmaTimerA])

  useEffect(() => {
    let timer: any
    if (csmaBState === 'backoff' && csmaTimerB > 0) {
      timer = setTimeout(() => setCsmaTimerB(t => t - 1), 1000)
    } else if (csmaBState === 'backoff' && csmaTimerB === 0) {
      setCsmaBState('transmitting')
      setCsmaLogs(prev => [...prev, `[CSMA] Node B backoff completed. Retransmitting packet.`])
      setTimeout(() => {
        setCsmaBState('idle')
        setCsmaLogs(prev => [...prev, `[CSMA] Node B packet sent successfully.`])
      }, 1500)
    }
    return () => clearTimeout(timer)
  }, [csmaBState, csmaTimerB])

  // 3. TCP Congestion step
  const stepTcp = () => {
    const nextX = tcpPoints.length
    let nextCwnd = tcpCwnd
    let nextPhase = tcpPhase

    if (tcpPhase === 'Slow Start') {
      nextCwnd = Math.min(64, tcpCwnd * 2)
      setTcpLogs(prev => [...prev, `[TCP] Slow Start: Doubling CWND to ${nextCwnd} (ssthresh: ${tcpSsthresh}).`])
      
      if (nextCwnd >= tcpSsthresh) {
        nextPhase = 'Congestion Avoidance'
        setTcpLogs(prev => [...prev, `[TCP] CWND reached ssthresh (${tcpSsthresh}). Switching to Congestion Avoidance (linear growth).`])
      }
    } else {
      nextCwnd = Math.min(64, tcpCwnd + 1)
      setTcpLogs(prev => [...prev, `[TCP] Congestion Avoidance: CWND increased linearly to ${nextCwnd}.`])
    }

    setTcpCwnd(nextCwnd)
    setTcpPhase(nextPhase)
    setTcpPoints(prev => [...prev, { x: nextX, y: nextCwnd, type: 'normal' }])
  }

  const triggerTcpLoss = (isTimeout = false) => {
    const nextX = tcpPoints.length
    let nextCwnd = 1
    let nextSsthresh = Math.max(2, Math.floor(tcpCwnd / 2))
    let nextPhase: 'Slow Start' | 'Congestion Avoidance' | 'Fast Recovery' = 'Slow Start'

    if (isTimeout) {
      nextCwnd = 1
      nextPhase = 'Slow Start'
      setTcpLogs(prev => [
        ...prev, 
        `[TCP] ☠ Timeout detected! Retransmission timer expired. Setting ssthresh = ${nextSsthresh}, resetting CWND = 1.`
      ])
    } else {
      nextCwnd = nextSsthresh
      nextPhase = 'Congestion Avoidance'
      setTcpLogs(prev => [
        ...prev, 
        `[TCP] ⚠ Triple Duplicate ACKs detected (fast loss). Halving CWND to ${nextCwnd}, setting ssthresh = ${nextSsthresh}.`
      ])
    }

    setTcpCwnd(nextCwnd)
    setTcpSsthresh(nextSsthresh)
    setTcpPhase(nextPhase)
    setTcpPoints(prev => [...prev, { x: nextX, y: nextCwnd, type: isTimeout ? 'timeout' : 'loss' }])
  }

  const resetTcp = () => {
    setTcpCwnd(1)
    setTcpSsthresh(16)
    setTcpPhase('Slow Start')
    setTcpPoints([{ x: 0, y: 1 }])
    setTcpLogs(['[TCP] Congestion engine reset. Starting Slow Start.'])
  }

  // ==========================================
  // Chaos Dashboard Sliders & Live Math
  // ==========================================
  useEffect(() => {
    // Math to compute reliability indexes based on stress vectors
    const baseScore = 99.999
    const penalty = (linkFlap * 0.003) + (packetLoss * 0.05) + (deviceFail * 0.8)
    const score = Math.max(12.456, baseScore - penalty)
    setReliabilityScore(parseFloat(score.toFixed(3)))

    // MTBF Calculation
    const mtbf = Math.max(0.5, 720 / (1 + (linkFlap * 0.1) + (packetLoss * 0.3) + (deviceFail * 1.5)))
    setMtbfHours(parseFloat(mtbf.toFixed(1)))

    // Update history for the mini-chart
    const nextHistory = [...chaosHistory.slice(1), Math.round(penalty * 1.5 + 10)]
    setChaosHistory(nextHistory)
  }, [linkFlap, packetLoss, deviceFail])

  // Get status color for chaos index
  const getChaosStatus = () => {
    if (reliabilityScore > 99.8) return { label: 'HEALTHY', color: 'green' }
    if (reliabilityScore > 95.0) return { label: 'DEGRADED', color: 'amber' }
    return { label: 'CRITICAL STRESS', color: 'red' }
  }

  // ==========================================
  // Terminal Emulator Engine
  // ==========================================
  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault()
    const input = terminalInput.trim().toLowerCase()
    if (!input) return

    let responses = [`$ simlab-admin --verify ${input}`]

    if (input === 'help') {
      responses = [
        ...responses,
        'Available routines:',
        '  verify-license    - Cryptographic asymmetric activation test',
        '  tamper-audit      - System anti-tamper and rollback detection logs',
        '  obfuscation-check - Check pyarmor local engine integrity',
        '  clear             - Clear display logs'
      ]
    } else if (input === 'clear') {
      setTerminalLines([])
      setTerminalInput('')
      return
    } else if (input === 'verify-license') {
      responses = [
        ...responses,
        '[Verification] Reading activation key payload from locally cached license...',
        '[Verification] Extracting public signature (RSA-2048)...',
        '[Verification] Decrypting signature block against internal public key...',
        '[Verification] OK. Key matches fingerprint: SHA256:4d6163...6e746f7368',
        '[Verification] SUCCESS: Licensing authority successfully verified.'
      ]
    } else if (input === 'tamper-audit') {
      if (isTampered) {
        responses = [
          ...responses,
          '[Audit] ERROR: System clock integrity check FAILED!',
          '[Audit] File timestamp: 2026-06-12T17:00:05',
          '[Audit] Checked system clock: 2024-01-01T00:00:00 (Backdated by 2.5 years)',
          '[Audit] CRITICAL: Clock rollback detected! Licensing protection locked.'
        ]
      } else {
        responses = [
          ...responses,
          '[Audit] Inspecting system telemetry logs...',
          '[Audit] Checking persistent timestamp log file...',
          '[Audit] Last recorded run: 2026-06-12T16:55:12',
          '[Audit] Current system clock: 2026-06-12T17:00:05',
          '[Audit] OK. Clock rollback check completed (Time delta: +4 min 53 sec).'
        ]
      }
    } else if (input === 'obfuscation-check') {
      responses = [
        ...responses,
        '[Integrity] Analyzing simulator runtime files...',
        '[Integrity] PyArmor runtime checks: OK',
        '[Integrity] Bytecode verification: checksum matches build specification.',
        '[Integrity] Anti-debugging hook check: ACTIVE.',
        '[Integrity] PyInstaller bundle configuration: verified safe.'
      ]
    } else {
      responses = [
        ...responses,
        `Command not recognized: "${input}". Type "help" for a list of system diagnostics.`
      ]
    }

    setTerminalLines(prev => [...prev, ...responses, ''])
    setTerminalInput('')
  }

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(id)
    setTimeout(() => setCopiedText(''), 2000)
  }

  return (
    <>
      {/* 1. Header Navigation */}
      <header className="nav-header">
        <div className="container nav-container">
          <a href="#" className="brand">
            <img src={frisscoSimlabLogo} alt="Frissco SimLab" style={{ height: '36px' }} />
          </a>
          <nav>
            <ul className="nav-links">
              <li><a href="#audience">Overview</a></li>
              <li><a href="#labs">Protocol Labs</a></li>
              <li><a href="#chaos">Chaos Engine</a></li>
              <li><a href="#security">Security</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><button onClick={() => setDownloadModalOpen(true)} className="btn btn-primary btn-sm" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Download CLI</button></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Ambient background decorative elements */}
      <div className="glow-ambient-2"></div>

      {/* 2. Hero Section */}
      <section className="hero-section-wrapper" id="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="badge badge-lavender hero-badge-pulse">
              <span className="hero-badge-dot"></span>
              Version 1.0.0 — Now Available
            </span>
          </div>

          <h1 className="hero-title">
            Simulate Networks.<br />
            <span className="hero-title-gradient">Verify Protocols.</span><br />
            Ship with Confidence.
          </h1>

          <p className="hero-subtitle">
            Frissco SimLab bridges the gap between abstract academic network concepts and production SDN routing validations. Build, stress-test, and verify complex topologies — visually, in real-time.
          </p>

          <div className="hero-actions">
            <button onClick={() => setDownloadModalOpen(true)} className="btn btn-primary hero-btn-primary">
              <Download size={18} />
              Get Started — Free
            </button>
            <a href="#contact" className="btn btn-secondary">
              Request Enterprise License
            </a>
          </div>

          <div className="hero-stats-row">
            <div className="hero-stat-chip">
              <Activity size={14} />
              <span>Real-Time Simulation</span>
            </div>
            <div className="hero-stat-chip">
              <Shield size={14} />
              <span>SDN Validated</span>
            </div>
            <div className="hero-stat-chip">
              <Cpu size={14} />
              <span>Protocol Accurate</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          {/* Animated network topology background */}
          <div className="hero-network-canvas">
            <svg className="hero-network-svg" viewBox="0 0 480 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Connection lines */}
              <line x1="240" y1="200" x2="120" y2="100" stroke="rgba(180,190,254,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" />
              <line x1="240" y1="200" x2="360" y2="100" stroke="rgba(180,190,254,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" style={{animationDelay: '0.5s'}} />
              <line x1="240" y1="200" x2="80" y2="280" stroke="rgba(137,180,250,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" style={{animationDelay: '1s'}} />
              <line x1="240" y1="200" x2="400" y2="290" stroke="rgba(137,180,250,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" style={{animationDelay: '1.5s'}} />
              <line x1="240" y1="200" x2="240" y2="60" stroke="rgba(203,166,247,0.15)" strokeWidth="1.5" strokeDasharray="6 4" className="hero-net-link" style={{animationDelay: '0.3s'}} />
              <line x1="120" y1="100" x2="80" y2="280" stroke="rgba(180,190,254,0.1)" strokeWidth="1" strokeDasharray="4 6" className="hero-net-link" style={{animationDelay: '0.7s'}} />
              <line x1="360" y1="100" x2="400" y2="290" stroke="rgba(180,190,254,0.1)" strokeWidth="1" strokeDasharray="4 6" className="hero-net-link" style={{animationDelay: '1.2s'}} />
              <line x1="80" y1="280" x2="240" y2="350" stroke="rgba(137,180,250,0.1)" strokeWidth="1" strokeDasharray="4 6" className="hero-net-link" style={{animationDelay: '0.9s'}} />
              <line x1="400" y1="290" x2="240" y2="350" stroke="rgba(137,180,250,0.1)" strokeWidth="1" strokeDasharray="4 6" className="hero-net-link" style={{animationDelay: '1.7s'}} />

              {/* Outer nodes */}
              <circle cx="120" cy="100" r="10" fill="rgba(180,190,254,0.12)" stroke="rgba(180,190,254,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" />
              <circle cx="120" cy="100" r="4" fill="var(--accent-lavender)" />

              <circle cx="360" cy="100" r="10" fill="rgba(137,180,250,0.12)" stroke="rgba(137,180,250,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '0.4s'}} />
              <circle cx="360" cy="100" r="4" fill="var(--accent-blue)" />

              <circle cx="80" cy="280" r="10" fill="rgba(203,166,247,0.12)" stroke="rgba(203,166,247,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '0.8s'}} />
              <circle cx="80" cy="280" r="4" fill="var(--accent-mauve)" />

              <circle cx="400" cy="290" r="10" fill="rgba(180,190,254,0.12)" stroke="rgba(180,190,254,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '1.2s'}} />
              <circle cx="400" cy="290" r="4" fill="var(--accent-lavender)" />

              <circle cx="240" cy="60" r="8" fill="rgba(166,227,161,0.12)" stroke="rgba(166,227,161,0.4)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '1.6s'}} />
              <circle cx="240" cy="60" r="3" fill="var(--accent-green)" />

              <circle cx="240" cy="350" r="8" fill="rgba(250,179,135,0.12)" stroke="rgba(250,179,135,0.35)" strokeWidth="1.5" className="hero-node hero-node-pulse" style={{animationDelay: '2s'}} />
              <circle cx="240" cy="350" r="3" fill="var(--accent-peach)" />

              {/* Centre hub ring */}
              <circle cx="240" cy="200" r="28" fill="rgba(180,190,254,0.06)" stroke="rgba(180,190,254,0.25)" strokeWidth="1.5" />
              <circle cx="240" cy="200" r="18" fill="rgba(180,190,254,0.08)" stroke="rgba(180,190,254,0.35)" strokeWidth="1" />
              <circle cx="240" cy="200" r="7" fill="var(--accent-lavender)" className="hero-hub-core" />
            </svg>

            {/* Floating ping chips */}
            <div className="hero-ping-chip hero-ping-chip-1">
              <span className="hero-ping-dot green"></span>
              <span>Router A — Online</span>
            </div>
            <div className="hero-ping-chip hero-ping-chip-2">
              <span className="hero-ping-dot blue"></span>
              <span>Link Latency 2ms</span>
            </div>
            <div className="hero-ping-chip hero-ping-chip-3">
              <span className="hero-ping-dot mauve"></span>
              <span>Packets: 4,821</span>
            </div>
          </div>

          {/* Logo card floating over canvas */}
          <div className="hero-logo-float-card">
            <div className="hero-logo-glow"></div>
            <img src={simlabLogo} alt="Frissco SimLab Logo" className="hero-logo-img" />
            <div className="hero-logo-meta">
              <h3>Frissco SimLab</h3>
              <p>Network Simulation Suite</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container" id="pricing" style={{ borderTop: '1px solid var(--surface-0)' }}>
        <div className="section-header">
          <span className="badge badge-lavender">Licensing Plans</span>
          <h2>Clear, Developer-Friendly Pricing</h2>
          <p>Deploy Frissco SimLab to technical classrooms or SDN engineering operations.</p>
        </div>

        <div className="pricing-grid">
          {/* Tier 1: Academic */}
          <div className="card pricing-card">
            <div>
              <span className="badge badge-blue">Educational</span>
              <h3 style={{ marginTop: '8px' }}>Academic Site License</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Ideal for colleges, lab courses, and technical academies.</p>
              
              <div className="price-box">
                <span className="price-num">$249</span>
                <span className="price-period">/ semester</span>
              </div>

              <ul className="pricing-features">
                <li><Check size={16} className="text-accent" /> Custom PDF report exports (for assignments)</li>
                <li><Check size={16} className="text-accent" /> 6 Interactive Protocol Laboratories</li>
                <li><Check size={16} className="text-accent" /> Multi-seat campus delivery (macOS, Win, Linux)</li>
                <li><Check size={16} className="text-accent" /> 24/7 Educational syllabus material access</li>
              </ul>
            </div>

            <button onClick={() => setDownloadModalOpen(true)} className="btn btn-secondary" style={{ width: '100%' }}>
              Download Academic Bundle
            </button>
          </div>

          {/* Tier 2: Enterprise */}
          <div className="card pricing-card popular">
            <div className="popular-badge">POPULAR</div>
            <div>
              <span className="badge badge-lavender">Commercial</span>
              <h3 style={{ marginTop: '8px' }}>Enterprise Team License</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>For SDN validation, DevOps teams, and network architects.</p>
              
              <div className="price-box">
                <span className="price-num">$899</span>
                <span className="price-period">/ year (seat-based)</span>
              </div>

              <ul className="pricing-features">
                <li><Check size={16} className="text-accent" /> Live Hybrid Emulation (FRR Docker bridge)</li>
                <li><Check size={16} className="text-accent" /> Autogenerate production-ready CLI scripts</li>
                <li><Check size={16} className="text-accent" /> Chaos Reliability Engine APIs</li>
                <li><Check size={16} className="text-accent" /> Full anti-tamper security integrations</li>
                <li><Check size={16} className="text-accent" /> Priority email & SLA developer support</li>
              </ul>
            </div>

            <a href="#contact" className="btn btn-primary" style={{ width: '100%' }}>
              Request Enterprise License
            </a>
          </div>
        </div>
      </section>

      {/* 8. Contact & Inquiry Form */}
      <section className="container" id="contact" style={{ borderTop: '1px solid var(--surface-0)', paddingBottom: '120px' }}>
        <div className="section-header" style={{ marginBottom: '40px' }}>
          <span className="badge badge-blue">Get in Touch</span>
          <h2>Contact the Frissco Team</h2>
          <p>Need evaluation trials, custom quotes, or have academic support questions? Write us a message.</p>
        </div>

        {formSubmitted ? (
          <div className="card text-center" style={{ maxWidth: '500px', margin: '0 auto', padding: '48px 32px' }}>
            <div className="feature-icon-wrapper" style={{ margin: '0 auto 16px', color: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}>
              <Check size={24} />
            </div>
            <h3>Message Transmitted</h3>
            <p className="mt-4" style={{ marginBottom: '24px' }}>
              Your inquiry has been successfully dispatched to the Frissco support desk. A representative will contact you at your provided email.
            </p>
            <button onClick={() => setFormSubmitted(false)} className="btn btn-outline btn-sm">Send another message</button>
          </div>
        ) : (
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              setFormSubmitted(true)
            }} 
            className="contact-form"
          >
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                required 
                value={contactForm.name} 
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} 
                className="form-input" 
                placeholder="Dr. Evelyn Vance"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                required 
                value={contactForm.email} 
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} 
                className="form-input" 
                placeholder="evance@university.edu"
              />
            </div>

            <div className="form-group">
              <label htmlFor="org">Organization</label>
              <input 
                type="text" 
                id="org" 
                value={contactForm.org} 
                onChange={(e) => setContactForm({ ...contactForm, org: e.target.value })} 
                className="form-input" 
                placeholder="Stanford University"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Inquiry Details</label>
              <textarea 
                id="message" 
                required 
                rows={4} 
                value={contactForm.message} 
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} 
                className="form-textarea" 
                placeholder="We would like to request a 14-day evaluation license of the hybrid emulating software for our lab class..."
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Mail size={16} /> Send Inquiry
            </button>
          </form>
        )}
      </section>

      {/* 9. Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="brand">
                <img src={simlabLogo} alt="Frissco SimLab" />
                <span>Frissco SimLab</span>
              </a>
              <p>
                Advanced, interactive SDN routing, network decay, and protocol lab emulation environment.
              </p>
            </div>

            <div className="footer-column">
              <h4>Documentation</h4>
              <ul>
                <li><a href="https://simlab.frissco.net" target="_blank" rel="noopener noreferrer">Official Site <ExternalLink size={12} style={{ display: 'inline', marginLeft: '2px' }} /></a></li>
                <li><a href="#audience">Overview</a></li>
                <li><a href="#labs">Integrated Laboratories</a></li>
                <li><a href="#security">Anti-Tampering Telemetry</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Support & Contact</h4>
              <ul>
                <li><a href="mailto:thefrisscoteamofficial@gmail.com">thefrisscoteamofficial@gmail.com</a></li>
                <li><a href="mailto:sales@frissco.net">sales@frissco.net</a></li>
                <li><a href="https://simlab.frissco.net/support">Help Desk</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 Frissco Inc. All rights reserved. Intellectual property protections apply.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 10. CLI Download Dialog Modal */}
      {downloadModalOpen && (
        <div className="modal-overlay" onClick={() => setDownloadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDownloadModalOpen(false)}>
              <X size={20} />
            </button>
            
            <span className="badge badge-lavender" style={{ marginBottom: '12px' }}>Download Terminal Bundle</span>
            <h3 style={{ marginBottom: '16px' }}>Installing Frissco SimLab</h3>
            <p style={{ fontSize: '0.95rem', marginBottom: '24px', color: 'var(--text-muted)' }}>
              Get started quickly with the lightweight native installer CLI. Run these scripts in your terminal to unpack the visual laboratory.
            </p>

            <div className="install-tabs">
              {/* Option 1: Standard installation */}
              <div className="install-comment"># Option A: Standard User Mode installation (Recommended)</div>
              <div className="install-terminal">
                <button 
                  onClick={() => copyToClipboard('./install.sh', 'std')} 
                  className="copy-btn"
                >
                  {copiedText === 'std' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <div className="install-command">./install.sh</div>
              </div>

              {/* Option 2: System-wide installation */}
              <div className="install-comment" style={{ marginTop: '20px' }}># Option B: System-wide installation (Requires privileges)</div>
              <div className="install-terminal">
                <button 
                  onClick={() => copyToClipboard('sudo ./install.sh', 'sys')} 
                  className="copy-btn"
                >
                  {copiedText === 'sys' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <div className="install-command">sudo ./install.sh</div>
              </div>

              {/* Option 3: Automated installation */}
              <div className="install-comment" style={{ marginTop: '20px' }}># Option C: Fully automated non-interactive install</div>
              <div className="install-terminal">
                <button 
                  onClick={() => copyToClipboard('./install.sh --yes', 'auto')} 
                  className="copy-btn"
                >
                  {copiedText === 'auto' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <div className="install-command">./install.sh --yes</div>
              </div>
            </div>

            <div style={{ marginTop: '28px', fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center' }}>
              Need help? View our <a href="https://simlab.frissco.net/docs" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Installation Documentation</a>.
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
