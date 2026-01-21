import { useState } from 'react'
import './App.css'

type StoneOption = 'A' | 'B' | 'C';
type Result = 'success' | 'fail' | null;

interface StoneState {
  A: Result[];
  B: Result[];
  C: Result[];
}

function App() {
  const [probability, setProbability] = useState(75);
  const [stones, setStones] = useState<StoneState>({
    A: [],
    B: [],
    C: []
  });
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastStatus, setLastStatus] = useState<string>('');

  // Helper to get number of successes/fails
  const getCounts = (res: Result[]) => ({
    success: res.filter(r => r === 'success').length,
    fail: res.filter(r => r === 'fail').length,
    length: res.length
  });

  const checkSuccess = (stones: StoneState, strategy: '77' | '16') => {
    const a = getCounts(stones.A);
    const b = getCounts(stones.B);
    const c = getCounts(stones.C);

    if (strategy === '77') {
      return a.success >= 7 && b.success >= 7 && c.success <= 4;
    } else if (strategy === '16') {
      if ((a.success + b.success >= 16) && (c.success <= 4)) {
        // Exclude 8/8
        if (!(a.success === 8 && b.success === 8)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleCut = (option: StoneOption) => {
    if (stones[option].length >= 10) return;

    const roll = Math.random() * 100;
    const isSuccess = roll < probability;
    const result: Result = isSuccess ? 'success' : 'fail';

    setStones(prev => ({
      ...prev,
      [option]: [...prev[option], result]
    }));

    setProbability(prev => {
      if (isSuccess) {
        return Math.max(25, prev - 10);
      } else {
        return Math.min(75, prev + 10);
      }
    });
  };

  const handleReset = () => {
    setProbability(75);
    setStones({ A: [], B: [], C: [] });
    setAttemptCount(0);
    setLastStatus('');
  };

  // Heuristic Logic - Pure Function for simulation
  const getNextMove = (
    currentProb: number,
    currentStones: StoneState,
    strategy: '77' | '16'
  ): StoneOption | null => {
    const a = getCounts(currentStones.A);
    const b = getCounts(currentStones.B);
    const c = getCounts(currentStones.C);

    if (a.length === 10 && b.length === 10 && c.length === 10) return null;

    const canCut = (opt: StoneOption) => currentStones[opt].length < 10;

    // Common Logic: Low probability -> Dump on C
    if (currentProb <= 45) {
      if (canCut('C')) return 'C';
    }

    if (strategy === '77') {
      if (!canCut('A') && !canCut('B')) return canCut('C') ? 'C' : null;
      if (!canCut('A')) return 'B';
      if (!canCut('B')) return 'A';

      if (a.success < b.success) return 'A';
      if (b.success < a.success) return 'B';
      return 'A';
    }

    if (strategy === '16') {
      if (!canCut('A') && !canCut('B')) return canCut('C') ? 'C' : null;

      if (canCut('A')) {
        return 'A';
      }
      return 'B';
    }

    return null;
  };

  const simulateOneStone = (strategy: '77' | '16') => {
    let curProb = 75;
    let curStones: StoneState = { A: [], B: [], C: [] };

    while (true) {
      const move = getNextMove(curProb, curStones, strategy);
      if (!move) break;

      const roll = Math.random() * 100;
      const isSuccess = roll < curProb;
      const result: Result = isSuccess ? 'success' : 'fail';

      curStones = {
        ...curStones,
        [move]: [...curStones[move], result]
      };

      if (isSuccess) {
        curProb = Math.max(25, curProb - 10);
      } else {
        curProb = Math.min(75, curProb + 10);
      }
    }
    return { stones: curStones, finalProb: curProb };
  };

  const runInstantAuto = (strategy: '77' | '16') => {
    const result = simulateOneStone(strategy);
    setProbability(result.finalProb);
    setStones(result.stones);
    setAttemptCount(prev => prev + 1);

    if (checkSuccess(result.stones, strategy)) {
      setLastStatus('성공!');
    } else {
      setLastStatus('실패');
    }
  };

  const runFullAuto = (strategy: '77' | '16') => {
    let attempts = 0;
    const maxAttempts = 2000;
    let success = false;
    let bestResult = null;

    while (attempts < maxAttempts) {
      attempts++;
      const result = simulateOneStone(strategy);
      bestResult = result;

      if (checkSuccess(result.stones, strategy)) {
        success = true;
        break;
      }
    }

    if (bestResult) {
      setProbability(bestResult.finalProb);
      setStones(bestResult.stones);
    }
    setAttemptCount(attempts);

    if (success) {
      setLastStatus('성공!');
    } else {
      setLastStatus(`실패 (최대 ${maxAttempts}회 초과)`);
    }
  };

  const renderRow = (option: StoneOption, label: string) => {
    const results = stones[option];
    const isFull = results.length >= 10;
    const counts = getCounts(results);

    return (
      <div className="stone-row">
        <div className="option-label">
          {label} <span className="count-badge">{counts.success}</span>
        </div>
        <div className="slots-container">
          {Array.from({ length: 10 }).map((_, i) => {
            const res = results[i];
            let className = "slot";

            if (res === 'success') {
              if (option === 'C') className += " c-success";
              else className += " success";
            }
            if (res === 'fail') className += " fail";

            return <div key={i} className={className}></div>;
          })}
        </div>
        <button
          className="cut-button"
          onClick={() => handleCut(option)}
          disabled={isFull}
        >
          세공
        </button>
      </div>
    );
  };

  return (
    <div className="app-container">
      <h1 className="title">로스트아크 97돌 시뮬레이터</h1>

      <div className="probability-display">
        성공 확률: <span className="prob-value">{probability}%</span>
      </div>

      <div className="stone-board">
        {renderRow('A', '옵션 A')}
        {renderRow('B', '옵션 B')}
        {renderRow('C', '옵션 C')}
      </div>

      <div className="attempt-display">
        시도 횟수: {attemptCount}
        <div className="status-message" style={{ color: lastStatus.includes('성공') ? '#4caf50' : '#ff4444' }}>
          {lastStatus}
        </div>
      </div>

      <div className="controls">
        <div className="control-group">
          <button className="auto-button" onClick={() => runInstantAuto('77')}>
            자동 7/7
          </button>
          <button className="auto-button red" onClick={() => runFullAuto('77')}>
            반복 7/7
          </button>
        </div>
        <div className="control-group">
          <button className="auto-button" onClick={() => runInstantAuto('16')}>
            자동 97돌
          </button>
          <button className="auto-button red" onClick={() => runFullAuto('16')}>
            반복 97돌
          </button>
        </div>

        <button className="reset-button" onClick={handleReset}>
          초기화
        </button>
      </div>
    </div>
  )
}

export default App
