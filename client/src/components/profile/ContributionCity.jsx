import { useMemo, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';

const PLATFORM_COLORS = {
    codeforces: '#1a8cff',
    leetcode: '#ffa116',
    codechef: '#5b4638',
    gfg: '#2f8d46',
};

const THEME = {
    empty: '#1e293b',
    tooltipBg: '#0f172a',
    tooltipBorder: '#334155',
    text: '#f8fafc'
};

function dateToKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function ContributionCity({ platforms }) {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const controlsRef = useRef();

    // Find the oldest year a user has data for to build the selector
    const years = useMemo(() => {
        let oldest = currentYear;
        for (const p of platforms) {
            if (!p.heatmap) continue;
            for (const key of Object.keys(p.heatmap)) {
                let y;
                if (key.includes('-')) y = parseInt(key.slice(0, 4));
                else {
                    const ts = key.length > 10 ? Math.floor(parseInt(key)/1000) : parseInt(key);
                    y = new Date(ts * 1000).getFullYear();
                }
                if (y < oldest) oldest = y;
            }
        }
        const yArr = [];
        for (let y = currentYear; y >= oldest; y--) yArr.push(y);
        return yArr;
    }, [platforms, currentYear]);

    const { gridList, maxCount } = useMemo(() => {
        const map = new Map();
        
        for (const p of platforms) {
            if (!p.heatmap) continue;
            for (const [key, count] of Object.entries(p.heatmap)) {
                let dateStr;
                if (key.includes('-')) dateStr = key.slice(0, 10);
                else {
                    const ts = key.length > 10 ? Math.floor(parseInt(key)/1000) : parseInt(key);
                    dateStr = dateToKey(new Date(ts * 1000));
                }
                const val = typeof count === 'number' ? count : 1;
                
                if (!map.has(dateStr)) {
                    map.set(dateStr, { total: val, dominantPlatform: p.platform, maxPlatformVal: val });
                } else {
                    const existing = map.get(dateStr);
                    existing.total += val;
                    if (val > existing.maxPlatformVal) {
                        existing.dominantPlatform = p.platform;
                        existing.maxPlatformVal = val;
                    }
                }
            }
        }

        const grid = [];
        
        // Build dates for the selected year
        const datesObj = [];
        let d;
        if (selectedYear === currentYear) {
            d = new Date(); d.setHours(0,0,0,0);
        } else {
            d = new Date(selectedYear, 11, 31, 0, 0, 0, 0); // Dec 31
        }
        
        // Get 365 days (or up to today if current year)
        // Actually, just get the full year's dates
        let daysInYear = selectedYear % 4 === 0 ? 366 : 365;
        if (selectedYear === currentYear) {
            const startOfYear = new Date(currentYear, 0, 1);
            daysInYear = Math.floor((d - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
        }

        for (let i = 0; i < daysInYear; i++) {
            datesObj.push(new Date(d));
            d.setDate(d.getDate() - 1);
        }
        datesObj.reverse();

        let maxC = 1;
        let currentWeek = 0;
        
        for (let i = 0; i < datesObj.length; i++) {
            const date = datesObj[i];
            const dow = date.getDay();
            const k = dateToKey(date);
            const data = map.get(k) || { total: 0, dominantPlatform: 'codeforces' };
            if (data.total > maxC) maxC = data.total;
            
            grid.push({
                x: dow,
                z: currentWeek,
                date: date.toDateString(),
                count: data.total,
                platform: data.dominantPlatform,
                color: data.total > 0 ? (PLATFORM_COLORS[data.dominantPlatform] || '#4caf50') : THEME.empty
            });
            
            if (dow === 6) currentWeek++;
        }
        
        return { gridList: grid, maxCount: maxC };
    }, [platforms, selectedYear, currentYear]);

    const [hoverCell, setHoverCell] = useState(null);

    return (
        <div style={{ width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden', background: '#020617', border: '1px solid #1e293b', position: 'relative' }}>
            {/* Header overlay */}
            <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10, pointerEvents: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>3D Contribution City</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>Interactive visualization of your year</p>
                </div>
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', padding: '6px 12px', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                >
                    {years.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            <Canvas camera={{ position: [25, 20, -10], fov: 40 }} onPointerMissed={() => setHoverCell(null)}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
                
                {/* Center the city. It spans x:0..6, z:0..52 */}
                {/* X runs left-right, Z runs back-forth */}
                <group position={[-3 * 1.5, 0, -26 * 1.5]}>
                    
                    {/* Day of Week Labels */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <Text 
                            key={`dow-${i}`}
                            position={[i * 1.5, 0.1, -1.5]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={0.8}
                            color="#94a3b8"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {day}
                        </Text>
                    ))}
                    
                    {/* Month Labels (Approximate by week) */}
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                        <Text 
                            key={`mon-${i}`}
                            position={[-1.5, 0.1, (i * 52/12) * 1.5 + 2]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={0.8}
                            color="#94a3b8"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {month}
                        </Text>
                    ))}

                    {gridList.map((cell, i) => {
                        const height = cell.count > 0 ? Math.max(0.5, (cell.count / maxCount) * 8) : 0.1;
                        return (
                            <mesh 
                                key={i} 
                                position={[cell.x * 1.5, height / 2, cell.z * 1.5]}
                                onPointerOver={(e) => { e.stopPropagation(); if (cell.count > 0) setHoverCell(cell); }}
                                onPointerOut={() => setHoverCell(null)}
                            >
                                <boxGeometry args={[1, height, 1]} />
                                <meshStandardMaterial color={hoverCell === cell ? '#fff' : cell.color} roughness={0.3} metalness={0.1} />
                            </mesh>
                        )
                    })}
                </group>

                <OrbitControls 
                    ref={controlsRef}
                    enablePan={true} 
                    enableZoom={true} 
                    enableRotate={true} 
                    target={[0, 0, 0]}
                    maxPolarAngle={Math.PI / 2 - 0.1} // don't go below ground
                    minDistance={10}
                    maxDistance={100}
                    minAzimuthAngle={-Infinity}
                    maxAzimuthAngle={Infinity}
                    onEnd={(e) => {
                        // Snap logic when user releases mouse
                        if (!controlsRef.current) return;
                        const control = controlsRef.current;
                        
                        // defined 4 orthogonal snap angles (xy and xz planes)
                        const snapAngles = [
                            0,                  // 0 deg (straight front)
                            Math.PI / 2,        // 90 deg (straight right)
                            Math.PI,            // 180 deg (straight back)
                            -Math.PI / 2        // -90 deg (straight left)
                        ];

                        const currentAngle = control.getAzimuthalAngle();
                        
                        // find closest angle
                        let closest = snapAngles[0];
                        let minDiff = Math.abs(currentAngle - snapAngles[0]);
                        
                        for(let i=1; i<snapAngles.length; i++) {
                            const diff = Math.abs(currentAngle - snapAngles[i]);
                            if (diff < minDiff) {
                                closest = snapAngles[i];
                                minDiff = diff;
                            }
                        }
                        
                        // We set azimuthal angle. OrbitControls doesn't have a built-in soft animation 
                        // for setting angle, but changing it triggers a render.
                        // For a smoother custom implementation we could interpolate, 
                        // but setting it directly here gives the "snap" effect requested.
                        control.setAzimuthalAngle(closest);
                        control.update();
                    }}
                />
                
                {hoverCell && (
                    <Html position={[hoverCell.x * 1.5 - 4.5, Math.max(0.5, (hoverCell.count / maxCount) * 8) + 1, hoverCell.z * 1.5 - 39]} style={{ pointerEvents: 'none' }}>
                        <div style={{ 
                            background: THEME.tooltipBg, 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            border: `1px solid ${hoverCell.color}`, 
                            fontSize: '0.875rem', 
                            whiteSpace: 'nowrap', 
                            color: THEME.text,
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                            transform: 'translate3d(-50%, -100%, 0)',
                            marginTop: '-10px'
                        }}>
                            <strong style={{ color: hoverCell.color }}>{hoverCell.count} submissions</strong>
                            <br/>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{hoverCell.date} via {hoverCell.platform}</span>
                        </div>
                    </Html>
                )}
            </Canvas>
            
            {/* Instruction overlay */}
            <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10, pointerEvents: 'none', background: 'rgba(2, 6, 23, 0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                Drag to rotate • Scroll to zoom
            </div>
        </div>
    );
}
