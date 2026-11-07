'use strict';

/**
 * NHIỆM VỤ 2: HUYẾT DẠ YÊU ẢNH (血夜妖影)
 * Thể loại: Kinh dị sinh tồn 2D (Survival Horror) & Rượt đuổi nghẹt thở
 * Kích hoạt: Ngay sau khi hoàn thành Nhiệm vụ 1, Tiểu Phàm về nhà ngủ.
 */
const Quest2 = (() => {
  const STORAGE_KEY = 'lang_du_lam_quest2_v1';

  const STATES = {
    LOCKED: 'locked',                         // Chưa xong Quest 1
    READY_TO_REST: 'ready_to_rest',           // Đã xong Quest 1, cần về nhà ngủ
    SLEEPING_START: 'sleeping_start',         // Lên giường, fade tối màn hình
    MIDNIGHT_WAKE: 'midnight_wake',           // 00:00, bừng tỉnh, tiếng hét xóm đông
    WINDOW_SHADOW: 'window_shadow',           // Bóng đen Liệp Ma ngoài cửa sổ
    COUNTDOWN_HIDE: 'countdown_hide',         // 10 giây sinh tử để trốn
    ATTACK_BED: 'attack_bed',                 // Chọn gầm giường -> Liệp Ma đập nát giường -> Chết
    ATTACK_WARDROBE: 'attack_wardrobe',       // Chọn tủ gỗ -> Liệp Ma xé toạc cửa tủ -> Chết
    ATTACK_DOOR_EARLY: 'attack_door_early',   // Chọn chạy ra cửa trong 10s -> Chạm mặt Liệp Ma -> Chết
    ATTACK_TIMEOUT: 'attack_timeout',         // Hết 10s chưa trốn -> Liệp Ma đạp cửa bắt tại chỗ -> Chết
    HIDING_JAR: 'hiding_jar',                 // Nấp trong chum -> Liệp Ma phá nhà rồi bỏ đi
    AFTER_LEAVING_DECISION: 'after_decision', // Bước ngoặt: Ra ngoài làng hay Nấp tới sáng
    CHASE_VILLAGE: 'chase_village',           // Nhánh A: Chạy trốn tự do trên map làng, Liệp Ma rượt đuổi
    CHASE_CAUGHT: 'chase_caught',             // Nhánh A: Bị Liệp Ma bắt kịp tử vong
    TIME_SKIP_DAWN: 'time_skip_dawn',         // Nhánh B: Nấp tới 06:00 sáng
    RUINS_EXPLORE: 'ruins_explore',           // Bước ra làng hoang tàn, hiện bảng tổng kết
    COMPLETED: 'completed'                    // Hoàn thành nhiệm vụ 2
  };

  let questData = {
    version: 1,
    state: STATES.LOCKED,
    completed: false,
    ruinsActive: false,
    bedBroken: false,
    wardrobeBroken: false,
    wallBroken: false,
    survivedInJar: false
  };

  // Liệp Ma Sprite Config (1152x1536, 8 rows x 6 cols, 192x192 px/frame)
  const LIEP_MA_IMG = new Image();
  LIEP_MA_IMG.src = 'liep-ma/liep-ma-sprites.webp';
  let liepMaLoaded = false;
  LIEP_MA_IMG.onload = () => { liepMaLoaded = true; };

  const LIEP_MA_ANIMS = {
    idle:   { row: 0, fps: 4,  frames: 6, loop: true },
    walk:   { row: 1, fps: 7,  frames: 6, loop: true },
    sniff:  { row: 2, fps: 5,  frames: 6, loop: true },
    run:    { row: 3, fps: 11, frames: 6, loop: true },
    attack: { row: 4, fps: 9,  frames: 6, loop: false },
    bite:   { row: 5, fps: 8,  frames: 6, loop: false },
    hit:    { row: 6, fps: 9,  frames: 6, loop: false },
    death:  { row: 7, fps: 7,  frames: 6, loop: false }
  };

  // Entity Liệp Ma trong hoạt cảnh / rượt đuổi
  let monster = {
    active: false,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    speed: 255, // Tốc độ chạy trên map làng (nhanh hơn Tiểu Phàm ~170px/s)
    action: 'walk',
    frame: 0,
    frameTimer: 0,
    facing: 1, // 1: nhìn phải, -1: nhìn trái
    scale: 0.44 // 192px * 0.44 = ~84px (gấp đôi người thường 36px)
  };

  // Timers & cinematic state
  let stateTimer = 0;
  let countdownTimer = 10.0;
  let heartbeatTimer = 0;
  let screenFadeAlpha = 0;
  let screenShake = 0;
  let nightAmbientAlpha = 0;
  let cinematicSubStep = 0;
  let jarPeekProgress = 0;
  let deathReason = '';
  let retryCheckpoint = 'midnight'; // 'midnight' hoặc 'in_jar'

  // Combat, Damage & Blood FX
  let damageTexts = [];
  let clawMarks = [];
  let bloodFlash = 0;
  let chaseAttackCooldown = 0;

  // Web Audio API Synthesizer cho SFX kinh dị
  function getAudioCtx() {
    if (typeof VillageMusic !== 'undefined' && VillageMusic.isMuted) return null;
    try {
      if (typeof VillageMusic !== 'undefined' && VillageMusic.audioCtx) {
        return VillageMusic.audioCtx;
      }
      if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
        if (!window._langDuLamSfxCtx) {
          window._langDuLamSfxCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return window._langDuLamSfxCtx;
      }
    } catch (e) {}
    return null;
  }

  function playHeartbeatSound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      // Nhịp 1: thình (trầm)
      const osc1 = actx.createOscillator();
      const gain1 = actx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, now);
      osc1.frequency.exponentialRampToValueAtTime(32, now + 0.14);
      gain1.gain.setValueAtTime(0.55, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(actx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Nhịp 2: thịch (nhẹ hơn, sau 0.18s)
      const osc2 = actx.createOscillator();
      const gain2 = actx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(48, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(28, now + 0.32);
      gain2.gain.setValueAtTime(0.42, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc2.connect(gain2);
      gain2.connect(actx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.36);
    } catch (e) {}
  }

  function playClawWoodSound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      const bufferSize = actx.sampleRate * 0.25;
      const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = actx.createBufferSource();
      noise.buffer = buffer;
      const filter = actx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(4.5, now);

      const gain = actx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(actx.destination);
      noise.start(now);
    } catch (e) {}
  }

  function playWoodCrashSound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(now);
      osc.stop(now + 0.52);

      // Noise crack
      const bSize = actx.sampleRate * 0.35;
      const buf = actx.createBuffer(1, bSize, actx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bSize; i++) d[i] = (Math.random() * 2 - 1);
      const src = actx.createBufferSource();
      src.buffer = buf;
      const f = actx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(800, now);
      const ngain = actx.createGain();
      ngain.gain.setValueAtTime(0.6, now);
      ngain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      src.connect(f);
      f.connect(ngain);
      ngain.connect(actx.destination);
      src.start(now);
    } catch (e) {}
  }

  function playJarTapSound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  function playMonsterGrowlSound(kind = 'grr-near', factor = 1) {
    if (typeof LiepMaSFX !== 'undefined') { LiepMaSFX.play(kind, factor); return; }
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.4);
      osc.frequency.linearRampToValueAtTime(95, now + 0.8);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.45, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(now);
      osc.stop(now + 1.0);
    } catch (e) {}
  }

  // Khởi tạo & Lưu trữ trạng thái
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d.state === 'string') {
          questData = { ...questData, ...d };
        }
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(questData));
    } catch (e) {}
  }

  // Persist meaningful transitions, even when a browser refresh occurs before autosave.
  function transitionTo(nextState) {
    questData.state = nextState;
    saveState();
  }

  function init() {
    loadState();
    // Kiểm tra liên tục nếu Quest 1 đã hoàn thành thì mở khóa Quest 2
    if (questData.state === STATES.LOCKED) {
      if (typeof Quest1 !== 'undefined' && Quest1.getState && Quest1.getState() === 'completed') {
        transitionTo(STATES.READY_TO_REST);
        saveState();
      }
    }
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = 1;
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => { el.style.opacity = 0; }, 4200);
  }

  // Kích hoạt khi Tiểu Phàm nằm ngủ sau khi Quest 1 hoàn thành
  function triggerRestAtHome(player) {
    if (questData.state !== STATES.READY_TO_REST) return false;
    transitionTo(STATES.SLEEPING_START);
    stateTimer = 0;
    screenFadeAlpha = 0;
    saveState();
    showToast('Tiểu Phàm mệt mỏi nằm xuống giường, chìm vào giấc ngủ sau ngày dài...');
    return true;
  }

  // Bắt đầu thức giấc nửa đêm (00:00)
  function startMidnightWake(player) {
    transitionTo(STATES.MIDNIGHT_WAKE);
    stateTimer = 0;
    nightAmbientAlpha = 0.22;
    screenFadeAlpha = 0;
    retryCheckpoint = 'midnight';

    // Đặt giờ làng thành 00:00 (nửa đêm)
    if (typeof Villagers !== 'undefined') {
      Villagers.minutes = 0; // 00:00
      const clockEl = document.getElementById('clock');
      if (clockEl) clockEl.textContent = `Ngày ${Villagers.day || 3} · 00:00`;
      const timeEl = document.getElementById('datetime-time');
      if (timeEl) timeEl.textContent = '00:00';
    }

    // Đặt Tiểu Phàm đứng cạnh giường (chống kẹt giường) & hồi phục 100 HP
    if (player) {
      player.x = 532;
      player.y = 232;
      player.dir = 'down';
      player.walk = 0;
      player.hp = player.maxHp || 100;
      player.knockedDown = false;
    }
    if (typeof p !== 'undefined' && p) {
      p.hp = p.maxHp || 100;
      p.knockedDown = false;
    }
    if (typeof TieuPhamHome !== 'undefined') {
      if (typeof TieuPhamHome.wakeForQuest === 'function') TieuPhamHome.wakeForQuest(player);
      TieuPhamHome.inside = true;
    }
    saveState();

    playHeartbeatSound();
    playMonsterGrowlSound('grr-distant', .85);
    showToast('⚡ MỘT TIẾNG THÉT THÊ LƯƠNG XÉ TOẠC MÀN ĐÊM! TIỂU PHÀM CHOÀNG TỈNH!');
  }

  // Chọn chỗ trốn trong 10 giây sinh tử
  function chooseHideSpot(spotId, player) {
    if (questData.state !== STATES.COUNTDOWN_HIDE) return;
    stateTimer = 0;
    cinematicSubStep = 0;

    if (spotId === 'bed') {
      // Trốn gầm giường
      transitionTo(STATES.ATTACK_BED);
      questData.wallBroken = true;
      screenShake = 20;
      playWoodCrashSound();
      if (player) { player.x = 548; player.y = 198; }
      showToast('Tiểu Phàm chui vội xuống gầm giường! RẦM!! Liệp Ma phá vỡ mảng tường lớn lao vào!');
    } else if (spotId === 'wardrobe') {
      // Trốn trong tủ
      transitionTo(STATES.ATTACK_WARDROBE);
      questData.wallBroken = true;
      screenShake = 20;
      playWoodCrashSound();
      if (player) { player.x = 129; player.y = 160; }
      showToast('Tiểu Phàm chui tọt vào tủ áo! RẦM!! Liệp Ma phá vỡ toác mảng tường lớn lao vào!');
    } else if (spotId === 'door') {
      // Chạy ra cửa ngay lúc này
      transitionTo(STATES.ATTACK_DOOR_EARLY);
      questData.wallBroken = true;
      screenShake = 20;
      playWoodCrashSound();
      if (player) { player.x = 352; player.y = 398; }
      showToast('Tiểu Phàm giật cửa lao ra, Liệp Ma phá toang mảng tường chặn đầu!');
    } else if (spotId === 'jar') {
      // Trốn trong chum nước (CON ĐƯỜNG DUY NHẤT)
      transitionTo(STATES.HIDING_JAR);
      questData.survivedInJar = true;
      questData.wallBroken = true;
      screenShake = 22;
      playWoodCrashSound();
      retryCheckpoint = 'in_jar';
      if (player) { player.x = 596; player.y = 381; }
      showToast('Tiểu Phàm nhảy vào chum nước! RẦM!! Liệp Ma phá vỡ 1 mảng tường lớn và đi vào!');
    }
    saveState();
  }

  // Tạo hiệu ứng số sát thương và vệt cào móng vuốt
  function spawnDamage(x, y, dmg, isCrit = false) {
    damageTexts.push({
      text: `-${dmg} HP`,
      x: x + (Math.random() - 0.5) * 16,
      y: y - 28,
      vy: -40,
      alpha: 1.0,
      color: isCrit ? '#ff1e32' : '#ff4d4d',
      font: isCrit ? 'bold 15px Georgia, serif' : 'bold 13px Georgia, serif'
    });
    clawMarks.push({ x, y: y - 10, alpha: 1.0 });
    bloodFlash = 0.65;
    screenShake = 16;
  }

  // YÊU CẦU: Yêu ma phải tấn công người và HP về 0 mới tính tử vong
  function applyMonsterAttack(player, damage, attackAnim = 'attack', reason = 'Bị Liệp Ma tấn công') {
    const targetPlayer = player || (typeof p !== 'undefined' ? p : null);
    updateMonsterAnim(0.016, attackAnim);
    playClawWoodSound();
    playMonsterGrowlSound();

    let curHp = 100;
    if (targetPlayer && typeof targetPlayer.hp === 'number') {
      curHp = targetPlayer.hp;
    } else if (typeof p !== 'undefined' && p && typeof p.hp === 'number') {
      curHp = p.hp;
    }

    const newHp = Math.max(0, curHp - damage);
    if (targetPlayer) {
      targetPlayer.hp = newHp;
    }
    if (typeof p !== 'undefined' && p) {
      p.hp = newHp;
    }

    const tx = targetPlayer ? targetPlayer.x : monster.x;
    const ty = targetPlayer ? targetPlayer.y : monster.y;
    spawnDamage(tx, ty, damage, newHp === 0);

    // CHỈ KHI HP VỀ 0 MỚI TÍNH LÀ TỬ VONG
    if (newHp <= 0) {
      if (targetPlayer) {
        targetPlayer.hp = 0;
        targetPlayer.knockedDown = true;
      }
      if (typeof p !== 'undefined' && p) {
        p.hp = 0;
        p.knockedDown = true;
      }
      setTimeout(() => {
        triggerDeath(reason);
      }, 850);
      return true; // Đã cạn kiệt HP
    }
    return false; // Còn sống
  }

  // Trigger chết và hiển thị màn hình Game Over (chỉ kích hoạt khi HP = 0)
  function triggerDeath(reason) {
    const pl = typeof p !== 'undefined' ? p : null;
    if (pl) {
      pl.hp = 0;
      pl.knockedDown = true;
    }
    deathReason = reason;
    screenShake = 18;
    playMonsterGrowlSound();

    setTimeout(() => {
      openDeathModal(reason);
    }, 900);
  }

  function openDeathModal(reason) {
    let modal = document.getElementById('quest2-death-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quest2-death-modal';
      modal.className = 'quest2-death-overlay';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="quest2-death-card">
        <div class="death-skull">💀</div>
        <div class="death-title">KHÍ HUYẾT CẠN KIỆT (0 / 100 HP)</div>
        <div class="death-subtitle">NGƯƠI ĐÃ CHẾT</div>
        <div class="death-reason">${reason}</div>
        <div class="death-hint">✦ Trước sức mạnh tuyệt đối của yêu ma Luyện Khí kỳ, phàm nhân chỉ có thể dùng mưu trí ẩn nhẫn che giấu khí tức. ✦</div>
        <button id="quest2-retry-btn" class="quest2-retry-button">
          ↺ Chơi Lại Từ Đầu (00:00 Nửa Đêm)
        </button>
      </div>
    `;
    modal.hidden = false;

    const btn = document.getElementById('quest2-retry-btn');
    if (btn) {
      btn.onclick = () => {
        modal.hidden = true;
        retryFromCheckpoint();
      };
    }
  }

  function retryFromCheckpoint(player) {
    if(typeof LiepMaSFX !== 'undefined') LiepMaSFX.stop();
    const pl = player || (typeof p !== 'undefined' ? p : null);
    screenFadeAlpha = 0;
    screenShake = 0;
    damageTexts = [];
    clawMarks = [];
    bloodFlash = 0;

    // YÊU CẦU: Chết là chơi lại từ đầu (00:00 Nửa đêm)
    transitionTo(STATES.MIDNIGHT_WAKE);
    questData.bedBroken = false;
    questData.wardrobeBroken = false;
    questData.wallBroken = false;
    questData.survivedInJar = false;
    questData.ruinsActive = false;
    questData.completed = false;
    saveState();

    // Hồi phục đầy đủ 100 HP cho Tiểu Phàm
    if (pl) {
      pl.hp = pl.maxHp || 100;
      pl.knockedDown = false;
    }
    if (typeof p !== 'undefined' && p) {
      p.hp = p.maxHp || 100;
      p.knockedDown = false;
    }

    startMidnightWake(pl);
    showToast('Chơi lại từ đầu: 00:00 Nửa đêm — Tiếng thét xé toạc màn đêm!');
  }

  // Cập nhật Sprite Liệp Ma
  function updateMonsterAnim(dt, action) {
    if (monster.action !== action) {
      monster.action = action;
      monster.frame = 0;
      monster.frameTimer = 0;
    }
    const cfg = LIEP_MA_ANIMS[action] || LIEP_MA_ANIMS.idle;
    monster.frameTimer += dt;
    const frameDur = 1.0 / cfg.fps;
    if (monster.frameTimer >= frameDur) {
      monster.frameTimer -= frameDur;
      if (monster.frame + 1 < cfg.frames) {
        monster.frame++;
      } else if (cfg.loop) {
        monster.frame = 0;
      }
    }
  }

  // Vẽ Sprite Liệp Ma
  function drawMonster(ctx, x, y, facing = 1) {
    if (!liepMaLoaded || !LIEP_MA_IMG) return;
    const cfg = LIEP_MA_ANIMS[monster.action] || LIEP_MA_ANIMS.idle;
    const row = cfg.row;
    const col = monster.frame;
    const sx = col * 192;
    const sy = row * 192;
    const dw = 192 * monster.scale;
    const dh = 192 * monster.scale;

    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) {
      ctx.scale(-1, 1);
    }
    // Dynamic contact shadow with grounded foot anchor, independent of collision.
    ctx.save();
    const moving = monster.action === 'run' || monster.action === 'walk';
    const shadowW = dw * (moving ? .32 : .36);
    ctx.fillStyle = 'rgba(7,6,12,.36)';
    ctx.beginPath();ctx.ellipse(0,-1,shadowW,dh*.067,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle = 'rgba(11,9,17,.13)';
    ctx.beginPath();ctx.ellipse(0,-2,shadowW*1.38,dh*.105,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Origin (0.5, 0.95): Chân tại (0, 0)
    ctx.drawImage(LIEP_MA_IMG, sx, sy, 192, 192, -dw * 0.5, -dh * 0.95, dw, dh);

    // Mắt đỏ ma khí rực sáng
    ctx.fillStyle = '#ff1122';
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(facing > 0 ? 12 : -12, -dh * 0.82, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // -------------------------------------------------------------
  // UPDATE LOOP CHÍNH CỦA NHIỆM VỤ 2
  // -------------------------------------------------------------
  function update(dt, timeSec, player, villagers, dtReal = dt) {
    // Tự động kiểm tra mở khóa sau Quest 1
    if (questData.state === STATES.LOCKED) {
      if (typeof Quest1 !== 'undefined' && Quest1.getState && Quest1.getState() === 'completed') {
        transitionTo(STATES.READY_TO_REST);
        saveState();
        showToast('✦ Nhiệm Vụ 2 Bắt Đầu: Hãy về nhà nằm lên giường nghỉ ngơi.');
      }
      return;
    }

    stateTimer += dt;
    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 24);

    // Cập nhật các hiệu ứng chiến đấu sát thương & vệt cào & màn hình chớp máu
    if (bloodFlash > 0) bloodFlash = Math.max(0, bloodFlash - dt * 1.6);
    for (let i = damageTexts.length - 1; i >= 0; i--) {
      const d = damageTexts[i];
      d.y += d.vy * dt;
      d.alpha -= dt * 0.9;
      if (d.alpha <= 0) damageTexts.splice(i, 1);
    }
    for (let i = clawMarks.length - 1; i >= 0; i--) {
      const c = clawMarks[i];
      c.alpha -= dt * 1.5;
      if (c.alpha <= 0) clawMarks.splice(i, 1);
    }

    // 1. SLEEPING_START: Fade tối màn hình rồi chuyển sang 00:00
    if (questData.state === STATES.SLEEPING_START) {
      screenFadeAlpha = Math.min(1.0, stateTimer / 1.4);
      if (stateTimer >= 1.6) {
        startMidnightWake(player);
      }
    }

    // 2. MIDNIGHT_WAKE: Thức giấc, màn hình mờ sáng, nghe tiếng cào vách
    else if (questData.state === STATES.MIDNIGHT_WAKE) {
      nightAmbientAlpha = 0.22;
      if (stateTimer % 1.2 < dt) playHeartbeatSound();
      if (stateTimer >= 2.2) {
        transitionTo(STATES.WINDOW_SHADOW);
        stateTimer = 0;
        cinematicSubStep = 0;
        playClawWoodSound();
        playMonsterGrowlSound('grr-distant');
        showToast('Có thứ gì đó cực kỳ to lớn... đang dừng lại ngoài cửa sổ nhà ngươi!');
      }
    }

    // 3. WINDOW_SHADOW: Bóng đen ngoài cửa sổ (wx:344, wy:68)
    else if (questData.state === STATES.WINDOW_SHADOW) {
      updateMonsterAnim(dt, 'sniff');
      if (stateTimer % 1.0 < dt) playHeartbeatSound();
      if (stateTimer >= 1.2 && cinematicSubStep === 0) {
        cinematicSubStep = 1;
        playClawWoodSound();
        playMonsterGrowlSound('sniff');
      }
      if (stateTimer >= 3.8) {
        // Chuyển sang 10 giây sinh tử để trốn
        transitionTo(STATES.COUNTDOWN_HIDE);
        countdownTimer = 10.0;
        stateTimer = 0;
        showToast('Vách nhà rung lên... Vết nứt đang lan rộng! Mau tìm chỗ ẩn nấp!');
      }
    }

    // 4. COUNTDOWN_HIDE: 10 Giây sinh tử
    else if (questData.state === STATES.COUNTDOWN_HIDE) {
      // dt is capped for physics; the 10-second deadline is wall-clock time.
      countdownTimer = Math.max(0, countdownTimer - Math.max(0, dtReal));
      // Ba đợt cào tường leo thang, không phát liên tục theo từng khung hình.
      const breachProgress = 1 - countdownTimer / 10;
      const impactThresholds = [0.24, 0.52, 0.79];
      if (cinematicSubStep < impactThresholds.length && breachProgress >= impactThresholds[cinematicSubStep]) {
        cinematicSubStep++;
        screenShake = Math.max(screenShake, 3 + cinematicSubStep * 2.5);
        playClawWoodSound();
      }
      heartbeatTimer += dt;
      const hbInterval = Math.max(0.35, countdownTimer / 12);
      if (heartbeatTimer >= hbInterval) {
        heartbeatTimer = 0;
        playHeartbeatSound();
      }

      // Tự động kiểm tra vị trí người chơi tới gần các chỗ trốn
      if (player && typeof TieuPhamHome !== 'undefined' && TieuPhamHome.inside) {
        // Tủ đồ gỗ: x: 84..174, y: 72..190
        if (player.x >= 78 && player.x <= 180 && player.y >= 70 && player.y <= 195) {
          chooseHideSpot('wardrobe', player);
          return;
        }
        // Gầm giường gỗ: x: 474..624, y: 108..214
        if (player.x >= 470 && player.x <= 630 && player.y >= 105 && player.y <= 218) {
          chooseHideSpot('bed', player);
          return;
        }
        // Chum nước góc nhà: x: 570..624, y: 355..405
        if (player.x >= 566 && player.x <= 628 && player.y >= 352 && player.y <= 408) {
          chooseHideSpot('jar', player);
          return;
        }
        // Cửa chính: y >= 410
        if (player.y >= 410) {
          chooseHideSpot('door', player);
          return;
        }
      }

      // Hết 10 giây chưa chọn chỗ trốn
      if (countdownTimer <= 0) {
        transitionTo(STATES.ATTACK_TIMEOUT);
        questData.wallBroken = true;
        stateTimer = 0;
        cinematicSubStep = 0;
        screenShake = 22;
        playWoodCrashSound();
        showToast('⚡ RẦM!! Liệp Ma phá vỡ toạc một mảng tường lớn xông vào xé xác ngươi!');
      }
    }

    // 4b. ATTACK_TIMEOUT: Chần chừ không trốn, Liệp Ma phá tường chậm rãi bước vào rồi tấn công
    else if (questData.state === STATES.ATTACK_TIMEOUT) {
      if (stateTimer < 0.6) {
        // Đứng tại lỗ hổng vách đánh hơi
        updateMonsterAnim(dt, 'sniff');
      } else if (stateTimer < 1.2) {
        // Từng bước chậm rãi đi vào phòng
        updateMonsterAnim(dt, 'walk');
        if (stateTimer >= 0.4 && cinematicSubStep === 0) {
          cinematicSubStep = 1;
          applyMonsterAttack(player, 50, 'attack', 'Liệp Ma phá vỡ tường từng bước tiến vào cào rách người ngươi!');
        }
      } else {
        updateMonsterAnim(dt, 'bite');
        if (stateTimer >= 1.5 && cinematicSubStep === 1) {
          cinematicSubStep = 2;
          applyMonsterAttack(player, 50, 'bite', 'Ngươi chần chừ không kịp tìm chỗ trốn. Liệp Ma phá vỡ tường lao vào kết liễu ngươi!');
        }
      }
    }

    // 5. ATTACK_BED: Liệp Ma phá vỡ tường, chậm rãi tiến vào và đập nát giường ngủ
    else if (questData.state === STATES.ATTACK_BED) {
      if (stateTimer < 0.8) {
        // Đứng tại miệng vách vỡ đánh hơi
        updateMonsterAnim(dt, 'sniff');
      } else if (stateTimer < 1.5) {
        // Từng bước chậm rãi tiến sang phía giường
        updateMonsterAnim(dt, 'walk');
        if (stateTimer >= 1.0 && cinematicSubStep === 0) {
          cinematicSubStep = 1;
          questData.bedBroken = true;
          screenShake = 16;
          playWoodCrashSound();
        }
      } else if (stateTimer < 2.2) {
        updateMonsterAnim(dt, 'attack');
        if (stateTimer >= 1.8 && cinematicSubStep === 1) {
          cinematicSubStep = 2;
          applyMonsterAttack(player, 50, 'attack', 'Liệp Ma bổ nát giường kéo ngươi ra cào xé!');
        }
      } else {
        updateMonsterAnim(dt, 'bite');
        if (stateTimer >= 2.7 && cinematicSubStep === 2) {
          cinematicSubStep = 3;
          applyMonsterAttack(player, 50, 'bite', 'Liệp Ma ngửi thấy mùi người trên giường, giơ vuốt đập nát vụn khung gỗ và cắn xé ngươi dưới gầm!');
        }
      }
    }

    // 6. ATTACK_WARDROBE: Liệp Ma phá vỡ tường, chậm rãi tiến vào và xé toạc tủ quần áo
    else if (questData.state === STATES.ATTACK_WARDROBE) {
      if (stateTimer < 0.8) {
        // Đứng tại miệng vách vỡ đánh hơi
        updateMonsterAnim(dt, 'sniff');
      } else if (stateTimer < 1.5) {
        // Từng bước chậm rãi tiến sang phía tủ
        updateMonsterAnim(dt, 'walk');
        if (stateTimer >= 1.0 && cinematicSubStep === 0) {
          cinematicSubStep = 1;
          questData.wardrobeBroken = true;
          screenShake = 16;
          playWoodCrashSound();
        }
      } else if (stateTimer < 2.2) {
        updateMonsterAnim(dt, 'attack');
        if (stateTimer >= 1.8 && cinematicSubStep === 1) {
          cinematicSubStep = 2;
          applyMonsterAttack(player, 50, 'attack', 'Liệp Ma giật toạc cánh tủ cào rách người ngươi!');
        }
      } else {
        updateMonsterAnim(dt, 'bite');
        if (stateTimer >= 2.7 && cinematicSubStep === 2) {
          cinematicSubStep = 3;
          applyMonsterAttack(player, 50, 'bite', 'Liệp Ma áp mắt vào khe cửa tủ rồi giật tung toác 2 cánh cửa, kéo ngươi ra vồ cắn tan xác!');
        }
      }
    }

    // 7. ATTACK_DOOR_EARLY: Chạy ra cửa chạm mặt Liệp Ma
    else if (questData.state === STATES.ATTACK_DOOR_EARLY) {
      updateMonsterAnim(dt, stateTimer < 0.9 ? 'attack' : 'bite');
      if (stateTimer >= 0.5 && cinematicSubStep === 0) {
        cinematicSubStep = 1;
        applyMonsterAttack(player, 50, 'attack', 'Vừa mở cửa lao ra bậc thềm, ngươi đã bị Liệp Ma vồ cào toác ngực!');
      }
      if (stateTimer >= 1.4 && cinematicSubStep === 1) {
        cinematicSubStep = 2;
        applyMonsterAttack(player, 50, 'bite', 'Vừa mở cửa lao ra bậc thềm, ngươi đã đâm sầm vào ngực Liệp Ma và bị nó đè bẹp cắn xé tức thì!');
      }
    }

    // 8. HIDING_JAR: Nấp trong chum (CON ĐƯỜNG DUY NHẤT) - 6 Giai đoạn nhịp nhàng, chậm rãi & đánh hơi
    else if (questData.state === STATES.HIDING_JAR) {
      // Giai đoạn 1 (0.0s - 1.6s): RẦM! Phá toang mảng tường lớn, Liệp Ma xuất hiện ở ngưỡng vách
      if (stateTimer < 1.6) {
        updateMonsterAnim(dt, 'idle');
        if (cinematicSubStep === 0) {
          cinematicSubStep = 1;
          questData.wallBroken = true;
          screenShake = 22;
          playWoodCrashSound();
          showToast('⚡ RẦM!! Mảng tường vỡ toang! Liệp Ma sừng sững ngay miệng lỗ hổng...');
        }
      }
      // Giai đoạn 2 (1.6s - 3.2s): Dừng lại trên đống đổ nát, cúi người đánh hơi lần 1
      else if (stateTimer < 3.2) {
        updateMonsterAnim(dt, 'sniff');
        if (cinematicSubStep < 2) {
          cinematicSubStep = 2;
          playClawWoodSound();
          showToast('Liệp Ma dừng lại trên đống gạch vỡ... Nó cúi gập thân người, hít hà đánh hơi...');
          playMonsterGrowlSound('sniff');
        }
      }
      // Giai đoạn 3 (3.2s - 5.0s): Từng bước chậm rãi đi vào phòng, giơ vuốt đập phá đồ đạc
      else if (stateTimer < 5.0) {
        updateMonsterAnim(dt, 'walk');
        if (!questData.bedBroken) {
          questData.bedBroken = true;
          questData.wardrobeBroken = true;
          screenShake = 14;
          playWoodCrashSound();
          showToast('Tiếng móng vuốt cào lẹt xẹt... Liệp Ma từng bước chậm rãi tiến vào phòng!');
        }
      }
      // Giai đoạn 4 (5.0s - 6.6s): Đứng giữa phòng cạnh bàn trà, đảo mắt đánh hơi lần 2
      else if (stateTimer < 6.6) {
        updateMonsterAnim(dt, 'sniff');
        if (cinematicSubStep < 3) {
          cinematicSubStep = 3;
          playClawWoodSound();
        }
      }
      // Giai đoạn 5 (6.6s - 7.6s): Tiếp cận thành chum, gõ vuốt và cúi sát ngửi nắp chum
      else if (stateTimer < 7.6) {
        updateMonsterAnim(dt, stateTimer < 7.0 ? 'walk' : 'sniff');
        if (stateTimer >= 6.8 && cinematicSubStep < 4) {
          cinematicSubStep = 4;
          playJarTapSound();
          setTimeout(playJarTapSound, 320);
        }
        if (stateTimer >= 7.2 && cinematicSubStep < 5) {
          cinematicSubStep = 5;
          playMonsterGrowlSound('grr-near');
        }
      }
      // Giai đoạn 6 (7.6s - 8.2s): Không thấy mùi người sống, gầm gừ thất vọng, quay người rời đi qua vách vỡ
      else if (stateTimer < 8.2) {
        updateMonsterAnim(dt, 'walk');
        if (cinematicSubStep < 6) {
          cinematicSubStep = 6;
          showToast('Liệp Ma không ngửi thấy hơi người sống... Nó đã quay lưng rời đi qua mảng tường vỡ!');
        }
      }
      // Giai đoạn 7 (>= 8.2s): Bước ngoặt hành động (Ra ngoài làng hay Nấp tiếp trong chum)
      else {
        transitionTo(STATES.AFTER_LEAVING_DECISION);
        stateTimer = 0;
        showToast('Liệp Ma đã ra ngoài... Nhấn [TRÈO RA] hoặc di chuyển để chạy ra ngoài, hoặc ở yên trong chum chờ sáng.');
      }
    }

    // 8b. AFTER_LEAVING_DECISION (Tự tương tác môi trường: di chuyển/bấm nút là trèo ra, chờ 5s là tới sáng)
    else if (questData.state === STATES.AFTER_LEAVING_DECISION) {
      // Nếu người chơi có thao tác di chuyển, lập tức trèo ra khỏi chum chạy trốn ngoài làng (Nhánh A)
      if (player && player.walk > 0) {
        startVillageChase(player);
        return;
      }
      // Nếu người chơi kiên nhẫn ẩn mình 5 giây trong chum mà không di chuyển (Nhánh B)
      if (stateTimer >= 5.0) {
        startWaitUntilDawn();
        return;
      }
    }

    // 9. CHASE_VILLAGE (Nhánh A: Tự do chạy trốn trên map làng, Liệp Ma rượt đuổi)
    else if (questData.state === STATES.CHASE_VILLAGE) {
      chaseAttackCooldown = Math.max(0, chaseAttackCooldown - dt);
      const targetPl = player || (typeof p !== 'undefined' ? p : null);
      if (targetPl) {
        // Cập nhật vị trí Liệp Ma truy đuổi người chơi với tốc độ cao hơn
        const dx = targetPl.x - monster.x;
        const dy = targetPl.y - monster.y;
        const dist = Math.hypot(dx, dy);

        monster.facing = dx >= 0 ? 1 : -1;
        updateMonsterAnim(dt, dist < 50 ? 'attack' : 'run');

        if (dist > 28) {
          // Liệp Ma chạy nhanh với 255 px/s (Tiểu Phàm ~170 px/s)
          const moveDist = monster.speed * dt;
          monster.x += (dx / dist) * moveDist;
          monster.y += (dy / dist) * moveDist;
        }

        // Tấn công khi bắt kịp người chơi (dist <= 40)
        if (dist <= 40 && chaseAttackCooldown <= 0) {
          const curHp = typeof targetPl.hp === 'number' ? targetPl.hp : 100;
          if (curHp > 50) {
            // Đòn thứ 1: vồ cào lưng -> trừ 50 HP (còn 50 HP)
            applyMonsterAttack(targetPl, 50, 'attack', 'Liệp Ma vồ cào lưng ngươi!');
            chaseAttackCooldown = 1.0;
            showToast('⚠️ Bị Liệp Ma cào toác lưng (-50 HP)! Ngươi còn 50 HP! Mau chạy trốn!');
          } else {
            // Đòn thứ 2: kết liễu -> trừ 50 HP (HP về 0)
            transitionTo(STATES.CHASE_CAUGHT);
            stateTimer = 0;
            applyMonsterAttack(targetPl, 50, 'bite', 'Liệp Ma chạy bằng 2 chân với tốc độ vượt trội gấp đôi phàm nhân! Ngươi không thể thoát bằng cách chạy bộ giữa đêm tối!');
          }
        }
      }
    }

    else if (questData.state === STATES.CHASE_CAUGHT) {
      updateMonsterAnim(dt, 'bite');
    }

    // 10. TIME_SKIP_DAWN (Nhánh B: Nấp tới 06:00 sáng)
    else if (questData.state === STATES.TIME_SKIP_DAWN) {
      if (stateTimer < 2.0) {
        screenFadeAlpha = Math.min(1.0, stateTimer / 1.5);
      } else if (stateTimer < 3.5) {
        // Chuyển giờ làng tới 06:00 sáng bình minh
        if (typeof Villagers !== 'undefined') {
          Villagers.minutes = 360; // 06:00 AM
          const clockEl = document.getElementById('clock');
          if (clockEl) clockEl.textContent = `Ngày ${Villagers.day || 4} · 06:00`;
          const timeEl = document.getElementById('datetime-time');
          if (timeEl) timeEl.textContent = '06:00';
        }
        screenFadeAlpha = Math.max(0, 1.0 - (stateTimer - 2.0) / 1.5);
      } else {
        // Trời sáng, Tiểu Phàm bước ra chum
        transitionTo(STATES.RUINS_EXPLORE);
        questData.ruinsActive = true;
        if(typeof LiepMaSFX !== 'undefined') LiepMaSFX.stop();
        saveState();
        if (player && typeof TieuPhamHome !== 'undefined' && TieuPhamHome.inside) {
          TieuPhamHome.exit(player);
          player.x = 221; player.y = 314;
          if (typeof GameSave !== 'undefined' && GameSave.save) GameSave.save(true, player);
        }
        stateTimer = 0;
        showToast('☀️ Trời đã sáng! Tiểu Phàm đẩy nắp chum bước ra ngoài sân...');
        setTimeout(() => {
          openVictoryModal();
        }, 800);
      }
    }
  }

  // Mở Bảng Tổng Kết Hoàn Thành Nhiệm Vụ 2
  function openVictoryModal() {
    let modal = document.getElementById('quest2-victory-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'quest2-victory-modal';
      modal.className = 'quest2-victory-overlay';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="quest2-victory-card">
        <div class="victory-crest">✦ 杜 ✦</div>
        <div class="victory-title">HOÀN THÀNH NHIỆM VỤ 2</div>
        <div class="victory-name">HUYẾT DẠ YÊU ẢNH</div>
        
        <div class="victory-info-grid">
          <div class="info-row">
            <span class="info-lbl">Thân phận:</span>
            <span class="info-val highlight">Kẻ Sống Sót Duy Nhất Làng Du Lãm</span>
          </div>
          <div class="info-row">
            <span class="info-lbl">Thời gian:</span>
            <span class="info-val">00:00 – Bình Minh (Sống sót qua đêm thảm sát)</span>
          </div>
          <div class="info-row">
            <span class="info-lbl">Phương thức:</span>
            <span class="info-val">Ẩn giấu khí tức trong chum nước & bùn ẩm</span>
          </div>
          <div class="info-row">
            <span class="info-lbl">Hiện trạng làng:</span>
            <span class="info-val warning">Bị phá hủy hoàn toàn thành bình địa</span>
          </div>
        </div>

        <div class="victory-quote">
          "Một đêm huyết hải, mái nhà xưa chỉ còn là tro tàn đổ nát.<br>
          Thiếu niên ôm nỗi bi thương, bắt đầu bước vào số kiếp nghịch thiên."
        </div>

        <button id="quest2-continue-btn" class="quest2-continue-button">
          BƯỚC TIẾP RA CỔNG LÀNG ➔
        </button>
      </div>
    `;
    modal.hidden = false;

    const btn = document.getElementById('quest2-continue-btn');
    if (btn) {
      btn.onclick = () => {
        modal.hidden = true;
        transitionTo(STATES.COMPLETED);
        questData.completed = true;
        questData.ruinsActive = true;
        saveState();

        const pl = typeof p !== 'undefined' ? p : null;
        if (pl && typeof TieuPhamHome !== 'undefined') {
          TieuPhamHome.exit(pl);
          pl.x = 221;
          pl.y = 314;
        }
        if (typeof GameSave !== 'undefined' && GameSave.save) GameSave.save(true, pl);
        showToast('Nhiệm vụ 2 hoàn thành! Làng Du Lãm đã biến thành phế tích. Hãy tiến ra Cổng Làng!');
      };
    }
  }

  // Bắt đầu Nhánh A: Chạy trốn tự do trên map làng
  function startVillageChase(player) {
    transitionTo(STATES.CHASE_VILLAGE);
    stateTimer = 0;
    if (typeof TieuPhamHome !== 'undefined') {
      TieuPhamHome.exit(player);
    }
    if (player) {
      player.x = 221;
      player.y = 314;
    }
    // Liệp Ma xuất hiện ở đầu ngõ (cách người chơi ~110px)
    monster.x = 160;
    monster.y = 230;
    monster.speed = 255;
    playMonsterGrowlSound();
    saveState();
    showToast('⚠️ LIỆP MA ĐÃ PHÁT HIỆN RA NGƯƠI! NÓ ĐANG ĐUỔI THEO VỚI TỐC ĐỘ KINH HOÀNG!');
  }

  // Called by actual keyboard/joystick movement, including when the player is inside a solid jar.
  function handleMovementIntent(player) {
    if (questData.state !== STATES.AFTER_LEAVING_DECISION) return false;
    startVillageChase(player);
    return true;
  }

  function isNavigationLocked() {
    return questData.state !== STATES.LOCKED &&
      questData.state !== STATES.READY_TO_REST &&
      questData.state !== STATES.COMPLETED;
  }

  // Freeze autonomous day/night time while a scripted midnight survival scene controls the clock.
  function isWorldTimeFrozen() { return isNavigationLocked(); }

  // Resume policy: interrupted combat/cinematic replays safely from 00:00, victory reopens.
  // Called after the generic game save has restored the player/world positions.
  function restoreAfterLoad(player) {
    if (questData.state === STATES.RUINS_EXPLORE) {
      questData.ruinsActive = true;
      const pl = player || (typeof p !== 'undefined' ? p : null);
      if (pl && typeof TieuPhamHome !== 'undefined' && TieuPhamHome.inside) {
        TieuPhamHome.exit(pl);
        pl.x = 221; pl.y = 314;
        if (typeof GameSave !== 'undefined' && GameSave.save) GameSave.save(true, pl);
      }
      openVictoryModal();
      return 'victory';
    }
    if (questData.state === STATES.COMPLETED) {
      questData.completed = true;
      questData.ruinsActive = true;
      // A previous generic save may have been recorded before the player left the jar.
      if (typeof TieuPhamHome !== 'undefined' && TieuPhamHome.inside) {
        const pl = player || (typeof p !== 'undefined' ? p : null);
        if (pl && typeof TieuPhamHome.exit === 'function') TieuPhamHome.exit(pl);
        if (pl) { pl.x = 221; pl.y = 314; }
        if (typeof GameSave !== 'undefined' && GameSave.save) GameSave.save(true, pl);
      }
      return 'completed';
    }
    const interrupted = [
      STATES.SLEEPING_START, STATES.MIDNIGHT_WAKE, STATES.WINDOW_SHADOW,
      STATES.COUNTDOWN_HIDE, STATES.ATTACK_BED, STATES.ATTACK_WARDROBE,
      STATES.ATTACK_DOOR_EARLY, STATES.ATTACK_TIMEOUT, STATES.HIDING_JAR,
      STATES.AFTER_LEAVING_DECISION, STATES.CHASE_VILLAGE,
      STATES.CHASE_CAUGHT, STATES.TIME_SKIP_DAWN
    ].includes(questData.state);
    if (!interrupted) return 'unchanged';
    questData.bedBroken = false;
    questData.wardrobeBroken = false;
    questData.wallBroken = false;
    questData.survivedInJar = false;
    questData.ruinsActive = false;
    questData.completed = false;
    stateTimer = 0;
    countdownTimer = 10;
    cinematicSubStep = 0;
    nightAmbientAlpha = 0.22;
    damageTexts = [];
    clawMarks = [];
    bloodFlash = 0;
    if (typeof TieuPhamHome !== 'undefined') TieuPhamHome.inside = true;
    startMidnightWake(player || (typeof p !== 'undefined' ? p : null));
    saveState();
    return 'midnight';
  }

  // Bắt đầu Nhánh B: Tiếp tục nấp trong chum tới bình minh
  function startWaitUntilDawn() {
    transitionTo(STATES.TIME_SKIP_DAWN);
    stateTimer = 0;
    showToast('Tiểu Phàm cắn chặt môi, kiên nhẫn ẩn mình dưới lớp bùn nước chờ trời sáng...');
  }

  // -------------------------------------------------------------
  // VẼ HUD & CÁC LỚP CINEMATIC TRÊN MÀN HÌNH
  // -------------------------------------------------------------
  function drawHUD(ctx, player, screenW, screenH, timeSec, dt) {
    if (questData.state === STATES.LOCKED || questData.state === STATES.READY_TO_REST) return;

    // 0. Màn hình chớp đỏ khi trúng móng vuốt Liệp Ma
    if (bloodFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(190, 0, 15, ${Math.min(0.55, bloodFlash)})`;
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();
    }

    // 1. Lớp bóng đêm u ám nửa đêm dạng Cinematic Vignette (giữ gian nhà rõ ràng, không làm đen tối mù)
    if (nightAmbientAlpha > 0 && questData.state !== STATES.RUINS_EXPLORE && questData.state !== STATES.COMPLETED) {
      ctx.save();
      const minR = Math.min(screenW, screenH) * 0.35;
      const maxR = Math.max(screenW, screenH) * 0.85;
      const vig = ctx.createRadialGradient(screenW / 2, screenH / 2, minR, screenW / 2, screenH / 2, maxR);
      vig.addColorStop(0, 'rgba(8, 12, 18, 0)');
      vig.addColorStop(0.7, `rgba(8, 12, 18, ${nightAmbientAlpha * 0.45})`);
      vig.addColorStop(1, `rgba(8, 12, 18, ${nightAmbientAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();
    }

    // 2. Hiệu ứng Screen Shake: scope the translation to this HUD only.
    // Without a matching restore(), all subsequent canvas drawings drift.
    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake;
      const sy = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx, sy);
    }

    // 3. Không vẽ thanh đếm ngược: người chơi nhìn thấy vết nứt trên vách nhà
    //    (drawInHome) lan rộng theo đúng thời gian thực còn lại.

    // 4. HIỆU ỨNG GÓC NHÌN KHE CHUM KHI ĐANG NẤP (Tương tác tự nhiên: chờ hoặc di chuyển)
    if (questData.state === STATES.HIDING_JAR || questData.state === STATES.AFTER_LEAVING_DECISION) {
      ctx.save();
      // Viền tối mô phỏng nắp chum tròn hé mở
      const grad = ctx.createRadialGradient(screenW / 2, screenH / 2, screenH * 0.18, screenW / 2, screenH / 2, screenH * 0.65);
      grad.addColorStop(0, 'rgba(0,0,0,0.15)');
      grad.addColorStop(0.65, 'rgba(0,0,0,0.78)');
      grad.addColorStop(1, 'rgba(0,0,0,0.96)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, screenW, screenH);

      // Chữ dẫn chuyện hồi hộp & tương tác môi trường
      ctx.font = 'italic 14px Georgia, serif';
      ctx.textAlign = 'center';
      if (questData.state === STATES.HIDING_JAR) {
        if (stateTimer < 1.6) {
          ctx.fillStyle = '#ff6b6b';
          ctx.fillText('⚡ RẦM!! Mảng tường vỡ toang! Liệp Ma sừng sững ngay miệng lỗ hổng...', screenW / 2, screenH - 50);
        } else if (stateTimer < 3.2) {
          ctx.fillStyle = '#ffd285';
          ctx.fillText('Liệp Ma dừng lại trên đống gạch vỡ... Nó cúi gập thân người, hít hà đánh hơi...', screenW / 2, screenH - 50);
        } else if (stateTimer < 5.0) {
          ctx.fillStyle = '#ff8888';
          ctx.fillText('Tiếng móng vuốt cào lẹt xẹt... Liệp Ma từng bước chậm rãi tiến vào giữa phòng!', screenW / 2, screenH - 50);
        } else if (stateTimer < 6.6) {
          ctx.fillStyle = '#ffd285';
          ctx.fillText('Liệp Ma đứng giữa phòng, đảo mắt đỏ rực rồi cúi đầu đánh hơi chuyên sâu...', screenW / 2, screenH - 50);
        } else if (stateTimer < 7.6) {
          ctx.fillStyle = '#ff4444';
          ctx.fillText('CỘC... CỘC... Liệp Ma gõ móng vuốt và áp sát mặt đánh hơi ngay trên nắp chum!', screenW / 2, screenH - 50);
        } else {
          ctx.fillStyle = '#a8e6cf';
          ctx.fillText('Bùn nước đã che giấu mùi sống... Liệp Ma gầm gừ thất vọng rồi quay người rời đi!', screenW / 2, screenH - 50);
        }
      } else {
        // STATES.AFTER_LEAVING_DECISION (Không dùng menu chọn - tự tương tác bằng nút điều khiển)
        ctx.fillStyle = '#fef08a';
        ctx.fillText('Liệp Ma đã ra sân... Nhấn [TRÈO RA] hoặc di chuyển để chạy ra ngoài, hoặc ở yên trong chum chờ sáng.', screenW / 2, screenH - 60);
        ctx.font = '12px Georgia, serif';
        ctx.fillStyle = '#86efac';
        ctx.fillText('Nín thở... chờ tiếng móng vuốt ngoài sân lắng xuống.', screenW / 2, screenH - 36);
      }
      ctx.restore();
    }

    // 5. MÀN HÌNH FADE MỜ ĐEN
    if (screenFadeAlpha > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(0, 0, 0, ${screenFadeAlpha})`;
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();
    }  ctx.restore(); // Scope the HUD's screen shake to this draw only.
  }

  // Xử lý Click / Chạm màn hình cho Quest 2
  function handleClick(rx, ry, player) {
    // Khi đang trong chum sau khi Liệp Ma rời đi, chạm vào màn hình là trèo ra ngoài
    if (questData.state === STATES.AFTER_LEAVING_DECISION) {
      startVillageChase(player);
      return true;
    }
    return false;
  }

  // Vẽ hiệu ứng vết móng vuốt cào rách và số sát thương bay lên
  function drawCombatEffects(ctx) {
    if (clawMarks.length > 0) {
      ctx.save();
      for (const m of clawMarks) {
        ctx.strokeStyle = `rgba(255, 30, 40, ${Math.max(0, m.alpha)})`;
        ctx.shadowColor = '#ff0033';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 3;
        for (let offset = -10; offset <= 10; offset += 10) {
          ctx.beginPath();
          ctx.moveTo(m.x + offset - 12, m.y - 14);
          ctx.lineTo(m.x + offset + 12, m.y + 14);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    if (damageTexts.length > 0) {
      ctx.save();
      for (const t of damageTexts) {
        ctx.font = t.font || 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, t.alpha * 0.85)})`;
        ctx.fillText(t.text, t.x + 1, t.y + 1);
        ctx.fillStyle = t.color || '#ff3333';
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.restore();
    }
  }

  // Vẽ các thực thể trong nhà hoặc ngoài map
  function drawWorld(ctx, timeSec) {
    // Vẽ Liệp Ma khi rượt đuổi ngoài map làng (Nhánh A)
    if (questData.state === STATES.CHASE_VILLAGE && monster) {
      drawMonster(ctx, monster.x, monster.y, monster.facing);
    }
    drawCombatEffects(ctx);
  }

  // Vết nứt tăng dần trên vách nhà, thể hiện 10 giây sinh tử mà không lộ HUD.
  // Vẽ trong không gian nội thất 704×462 (sau nội thất, trước hiệu ứng quái vật).
  // Các nhánh cố định tránh nhấp nháy/ngẫu nhiên giữa các frame và không thay đổi gameplay.
  function drawGrowingWallCracks(ctx, timeSec) {
    if (questData.state !== STATES.COUNTDOWN_HIDE) return;
    const progress = Math.max(0, Math.min(1, 1 - countdownTimer / 10));
    const paths = [
      { at: 0.00, points: [[343,60],[332,72],[340,82],[328,94],[335,108],[323,123],[307,140]] },
      { at: 0.10, points: [[430,58],[440,73],[432,86],[447,97],[434,112],[445,133],[434,146]] },
      { at: 0.21, points: [[335,84],[322,82],[313,95],[303,102]] },
      { at: 0.30, points: [[433,86],[446,81],[450,68]] },
      { at: 0.40, points: [[382,58],[371,65],[356,58],[342,64]] },
      { at: 0.49, points: [[344,119],[340,133],[324,145]] },
      { at: 0.57, points: [[430,123],[417,131],[410,147]] },
      { at: 0.68, points: [[375,126],[386,136],[374,146],[363,152]] },
      { at: 0.76, points: [[319,103],[305,112],[300,130]] },
      { at: 0.84, points: [[439,109],[446,117],[453,132]] }
    ];
    ctx.save();
    ctx.beginPath();
    ctx.rect(298,56,158,98);
    ctx.clip();

    // Bóng Liệp Ma áp sát ô cửa, đầu và móng vuốt húc/cào tường theo từng nhịp.
    // Chỉ lộ hình bóng ngoài cửa sổ, cơ thể vẫn ở bên ngoài tới khi tường thủng.
    if (progress > 0.08) {
      ctx.save();
      ctx.beginPath(); ctx.rect(345,69,82,51); ctx.clip();
      const shadowAlpha = Math.min(0.93, 0.3 + progress * 0.72);
      const sway = Math.sin(timeSec * (3 + progress * 3)) * (2 + progress * 4);
      ctx.fillStyle = `rgba(11,8,15,${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(389 + sway, 111, 32 + progress * 8, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,30,47,${0.3 + progress * 0.65})`;
      ctx.shadowColor = '#e01229'; ctx.shadowBlur = 6 + progress * 9;
      for (const x of [377 + sway, 395 + sway]) {
        ctx.beginPath(); ctx.ellipse(x, 91, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    // Bụi đất rơi theo từng nhịp rung, không dùng hình ảnh nặng hoặc panel che chơi.
    if (progress > 0.34) {
      for (let i = 0; i < 18; i++) {
        const drift = (timeSec * (10 + i % 4 * 3) + i * 11) % 72;
        const x = 305 + ((i * 41) % 144);
        const y = 65 + ((i * 7 + drift) % 83);
        ctx.fillStyle = `rgba(204,171,124,${Math.min(0.50,progress * 0.34)})`;
        ctx.fillRect(x, y, 1.4 + i % 2, 1.4 + i % 2);
      }
    }
    const drawSegment = (points, ratio) => {
      // Tiến dần trên từng đoạn theo phần trăm tiến trình; không hiện cả vết nứt ngay lập tức.
      const distances = [];
      let length = 0;
      for (let i = 1; i < points.length; i++) {
        const d = Math.hypot(points[i][0]-points[i-1][0], points[i][1]-points[i-1][1]);
        distances.push(d);
        length += d;
      }
      let remaining = Math.max(0, Math.min(1, ratio)) * length;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length && remaining > 0; i++) {
        const u = Math.min(1, remaining / distances[i - 1]);
        ctx.lineTo(points[i-1][0] + (points[i][0]-points[i-1][0]) * u,
                   points[i-1][1] + (points[i][1]-points[i-1][1]) * u);
        remaining -= distances[i - 1];
      }
    };
    for (const path of paths) {
      if (progress <= path.at) continue;
      const spread = Math.min(1, (progress - path.at) / Math.max(0.08, 0.42 - path.at * 0.2));
      // Quầng đen mở rộng dần, tia sáng mờ hắt qua khe nứt.
      drawSegment(path.points, spread);
      ctx.strokeStyle = `rgba(31,17,18,${Math.min(0.96,0.60 + progress * 0.36)})`;
      ctx.lineWidth = 1.1 + progress * 3.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'bevel';
      ctx.stroke();
      drawSegment(path.points, spread);
      ctx.strokeStyle = `rgba(230,166,133,${Math.min(0.8,0.17 + progress * 0.46)})`;
      ctx.lineWidth = 0.7 + progress * 0.7;
      ctx.stroke();
    }
    // Gần phá tường, ma khí đỏ rò qua khe, vết nứt rung nhẹ (không che nền).
    if (progress > 0.72) {
      ctx.strokeStyle = `rgba(194,38,48,${(progress - 0.72) * 1.6 * (0.7 + 0.3*Math.sin(timeSec*12))})`;
      ctx.lineWidth = 1.5;
      for (const path of [paths[0], paths[1]]) {
        drawSegment(path.points, 1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Vẽ Liệp Ma & Đồ vỡ trong nhà Tiểu Phàm
  function drawInHome(ctx, timeSec) {
    if(typeof VillageRaidFX!=='undefined')VillageRaidFX.drawInterior(ctx,timeSec);
    drawGrowingWallCracks(ctx, timeSec);
    // 1. Vẽ bóng Liệp Ma ngoài ô cửa sổ (wx:344, wy:68, ww:84, wh:53)
    if (questData.state === STATES.WINDOW_SHADOW) {
      ctx.save();
      // Clip theo khung cửa sổ
      ctx.beginPath();
      ctx.rect(344, 68, 84, 53);
      ctx.clip();

      // Cái bóng đen khổng lồ
      ctx.fillStyle = 'rgba(8, 6, 12, 0.94)';
      ctx.beginPath();
      ctx.ellipse(386, 102, 38, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hai mắt đỏ rực quét qua cửa sổ
      ctx.fillStyle = '#ff0022';
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(376, 92, 4, 0, Math.PI * 2);
      ctx.arc(396, 92, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Vẽ Liệp Ma khi đang ở trong nhà (từng bước chậm rãi đi vào, đánh hơi, lùng sục)
    if (questData.state === STATES.ATTACK_TIMEOUT) {
      let mx = 374, my = 150, mf = -1;
      if (stateTimer < 0.6) {
        mx = 374; my = 150; mf = -1;
      } else if (stateTimer < 1.2) {
        const u = (stateTimer - 0.6) / 0.6;
        mx = 374 + (352 - 374) * u;
        my = 150 + (280 - 150) * u;
        mf = -1;
      } else {
        mx = 352; my = 330; mf = -1;
      }
      drawMonster(ctx, mx, my, mf);
    } else if (questData.state === STATES.ATTACK_BED) {
      let mx = 374, my = 150, mf = 1;
      if (stateTimer < 0.8) {
        mx = 374; my = 150; mf = 1;
      } else if (stateTimer < 1.5) {
        const u = (stateTimer - 0.8) / 0.7;
        mx = 374 + (548 - 374) * u;
        my = 150 + (224 - 150) * u;
        mf = 1;
      } else {
        mx = 548; my = 224; mf = -1;
      }
      drawMonster(ctx, mx, my, mf);
    } else if (questData.state === STATES.ATTACK_WARDROBE) {
      let mx = 374, my = 150, mf = -1;
      if (stateTimer < 0.8) {
        mx = 374; my = 150; mf = -1;
      } else if (stateTimer < 1.5) {
        const u = (stateTimer - 0.8) / 0.7;
        mx = 374 + (134 - 374) * u;
        my = 150 + (186 - 150) * u;
        mf = -1;
      } else {
        mx = 134; my = 186; mf = 1;
      }
      drawMonster(ctx, mx, my, mf);
    } else if (questData.state === STATES.ATTACK_DOOR_EARLY) {
      drawMonster(ctx, 352, 404, -1);
    } else if (questData.state === STATES.HIDING_JAR) {
      let mx = 374, my = 148, mf = -1;
      if (stateTimer < 1.6) {
        // Giai đoạn 1: Đứng sừng sững tại miệng lỗ thủng vách vỡ
        mx = 374; my = 148; mf = -1;
      } else if (stateTimer < 3.2) {
        // Giai đoạn 2: Cúi gập thân người đánh hơi tại đống gạch vỡ
        mx = 374; my = 154; mf = (stateTimer % 1.0 < 0.5) ? -1 : 1;
      } else if (stateTimer < 5.0) {
        // Giai đoạn 3: Từng bước chậm rãi đi vào giữa phòng
        const u = (stateTimer - 3.2) / 1.8;
        mx = 374 + (400 - 374) * u;
        my = 154 + (235 - 154) * u;
        mf = -1;
      } else if (stateTimer < 6.6) {
        // Giai đoạn 4: Đứng giữa phòng cạnh bàn trà, đảo mắt đánh hơi
        mx = 400; my = 235; mf = (stateTimer < 5.8) ? -1 : 1;
      } else if (stateTimer < 7.6) {
        // Giai đoạn 5: Bước tới sát chum nước và cúi ngửi
        const u = Math.min(1, (stateTimer - 6.6) / 0.8);
        mx = 400 + (588 - 400) * u;
        my = 235 + (362 - 235) * u;
        mf = 1;
      } else {
        // Giai đoạn 6: Quay người chậm rãi bước trở lại lỗ vách vỡ rời đi
        const u = Math.min(1, (stateTimer - 7.6) / 0.6);
        mx = 588 + (380 - 588) * u;
        my = 362 + (165 - 362) * u;
        mf = -1;
      }
      drawMonster(ctx, mx, my, mf);
    }

    // 3. Vẽ trạng thái giường bị đập nát
    if (questData.bedBroken) {
      ctx.save();
      // Mảnh ván gãy ngổn ngang
      ctx.fillStyle = '#362314';
      ctx.fillRect(480, 142, 54, 14);
      ctx.fillRect(546, 158, 62, 16);
      ctx.fillStyle = '#22150b';
      ctx.fillRect(520, 130, 18, 52);
      // Nệm rách tơi tả
      ctx.fillStyle = '#4c5c56';
      ctx.beginPath();
      ctx.roundRect(495, 138, 42, 36, 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Vẽ trạng thái tủ gỗ bị xé toạc
    if (questData.wardrobeBroken) {
      ctx.save();
      // Cánh tủ văng ra nền nhà
      ctx.fillStyle = '#5c3f26';
      ctx.save();
      ctx.translate(142, 204);
      ctx.rotate(0.35);
      ctx.fillRect(-18, -45, 36, 90);
      ctx.restore();
      ctx.restore();
    }

    // 4b. Dấu hiệu môi trường tối giản, không dán nhãn che đồ vật trong phòng.
    if (questData.state === STATES.COUNTDOWN_HIDE) {
      ctx.save();
      const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin((timeSec || 0) * 5));
      for (const mark of [
        { x: 596, y: 365, color: 'rgba(121,222,155,' },
        { x: 548, y: 190, color: 'rgba(233,195,123,' },
        { x: 142, y: 166, color: 'rgba(233,195,123,' }
      ]) {
        ctx.strokeStyle = mark.color + (0.20 + pulse * 0.25) + ')';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(mark.x, mark.y, 15, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Hiệu ứng vết cào và số sát thương trong nhà
    drawCombatEffects(ctx);
  }

  return {
    init,
    update,
    drawHUD,
    drawWorld,
    drawInHome,
    handleClick,
    triggerRestAtHome,
    chooseHideSpot,
    startVillageChase,
    startWaitUntilDawn,
    retryFromCheckpoint,
    startMidnightWake,
    openVictoryModal,
    saveState,
    restoreAfterLoad,
    handleMovementIntent,
    isNavigationLocked,
    isWorldTimeFrozen,
    getState: () => questData.state,
    isCompleted: () => questData.completed,
    isVillageRuined: () => questData.ruinsActive,
    isBedBroken: () => questData.bedBroken,
    isWardrobeBroken: () => questData.wardrobeBroken,
    isWallBroken: () => questData.wallBroken,
    getData: () => ({ ...questData }),
    resetState: () => {
      questData = {
        version: 1,
        state: STATES.LOCKED,
        completed: false,
        ruinsActive: false,
        bedBroken: false,
        wardrobeBroken: false,
        wallBroken: false,
        survivedInJar: false
      };
      saveState();
    }
  };
})();
