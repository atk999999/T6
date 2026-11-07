'use strict';

/**
 * NHIỆM VỤ 1: TIÊN DUYÊN KHỞI ĐẦU
 * Hồi 1: Lời Báo Của Trưởng Làng
 * Hồi 2: Tiên Nhân Giáng Lâm — Khảo Nghiệm Linh Căn
 */
const Quest1 = (() => {
  const STORAGE_KEY = 'lang_du_lam_quest1_v1';

  const STATES = {
    NOT_STARTED: 'not_started',
    CHIEF_APPROACHING: 'chief_approaching',
    DIALOGUE_ACTIVE: 'dialogue_active',
    CONSIDERING: 'considering',
    DECLINED: 'declined',
    REGISTERED: 'registered',
    AWAITING_SELECTION: 'awaiting_selection',
    SELECTION_READY: 'selection_ready',
    CINEMATIC_ACTIVE: 'cinematic_active',
    COMPLETED: 'completed'
  };

  const AVATARS = {
    truong: 'Truong_Lang_Avatar_9KB.webp',
    tieuPham: 'tieu-pham-avatar.webp',
    aHuy: 'A_Huy_Avatar_Duoi_10KB.webp',
    lucNham: 'Luc_Nham_Truc_Co_So_Ky_Avatar_Duoi10KB.webp'
  };

  // Tọa độ tâm quảng trường làng (sân làng hoa sen ngọc bích)
  const SQUARE_CENTER = { x: 680, y: 510 };
  const LEGACY_SQUARE_CENTER = { x: 800, y: 550 };
  // Khu A — Vị trí chủ trì (phía trên vòng tròn hoa văn, hướng xuống hàng thiếu niên)
  const LUC_NHAM_STAND = { x: 646, y: 442 };
  const CHIEF_SQUARE_POS = { x: 714, y: 442 };
  // Khu B — Trung tâm khảo nghiệm (chính giữa hoa văn hình tròn)
  const STONE_POS = { x: 680, y: 498 };
  const TEST_STAND_POS = { x: 680, y: 518 };
  // Khu C — Hàng thiếu niên (xếp hàng ngay ngắn phía dưới vòng tròn)
  const PHAM_SQUARE_POS = { x: 680, y: 568 };
  const AHUY_SQUARE_POS = { x: 725, y: 568 };
  const AHUY_PASSED_POS = { x: 785, y: 472 };

  const CANDIDATE_STATES = {
    WAITING: 'WAITING',
    CALLED: 'CALLED',
    WALKING: 'WALKING',
    TESTING: 'TESTING',
    RESULT: 'RESULT',
    EXITED: 'EXITED'
  };

  const STONE_STATES = {
    IDLE: 'IDLE',
    TESTING: 'TESTING',
    NO_ROOT: 'NO_ROOT',
    HAS_ROOT: 'HAS_ROOT',
    RESET: 'RESET'
  };

  // Khu C: Hàng thiếu niên đủ tuổi khảo nghiệm
  const TEENAGER_QUEUE_SLOTS = [
    { id: 'an', name: 'Tiểu An', x: 590, y: 568, exitX: 535, exitY: 518, testable: true },
    { id: 'minh', name: 'Tiểu Minh', x: 635, y: 568, exitX: 535, exitY: 548, testable: true },
    { id: 'tieuPham', name: 'Tiểu Phàm', x: 680, y: 568, exitX: 680, exitY: 568, testable: true },
    { id: 'aHuy', name: 'A Huy', x: 725, y: 568, exitX: 785, exitY: 472, testable: true },
    { id: 'tung', name: 'Tiểu Tùng', x: 770, y: 568, exitX: 770, exitY: 568, testable: false },
    { id: 'cuc', name: 'Bé Cúc', x: 635, y: 602, exitX: 535, exitY: 578, testable: true },
    { id: 'sen', name: 'Bé Sen', x: 725, y: 602, exitX: 725, exitY: 602, testable: false }
  ];

  // Khu D: Nông dân đứng riêng bên trái ngoài quảng trường, người lớn tuổi & dân làng đứng bên phải ngoài quảng trường
  const FARMER_WATCH_SLOTS = [
    { id: 'tran', x: 465, y: 515, dir: 1 },
    { id: 'binh', x: 448, y: 548, dir: 1 },
    { id: 'dao', x: 478, y: 580, dir: 1 },
    { id: 'lien', x: 458, y: 612, dir: 1 }
  ];

  const VILLAGER_WATCH_SLOTS = [
    { id: 'ho', x: 865, y: 515, dir: -1 },
    { id: 'son', x: 888, y: 548, dir: -1 },
    { id: 'ngu', x: 862, y: 580, dir: -1 },
    { id: 'hong', x: 882, y: 612, dir: -1 }
  ];

  let questData = {
    version: 1,
    state: STATES.CHIEF_APPROACHING,
    approachDelay: 30.0,
    hasMetChief: false,
    registeredDay: null,
    choice: null,
    history: [],
    spiritualRoot: null,
    rivalryReaction: null,
    completed: false
  };

  let questDetailTimer = 0;

  let initialized = false;
  let dialogueActive = false;
  let currentScript = [];
  let scriptIndex = 0;
  let isTyping = false;
  let displayedText = '';
  let fullText = '';
  let typeIndex = 0;
  let typeTimer = null;
  let routeTimer = 0;
  let calloutCooldown = 0;
  let toastTimer = 0;
  let toastMessage = '';
  let cachedChief = null;
  let cachedVillagers = null;
  let cachedPlayer = null;

  // Cinematic & Ceremony State Variables
  let cinematicStep = 0;
  let cinematicTimer = 0;
  let stepSubPhase = 'init';
  let stepSubTimer = 0;
  let currentCandidateIdx = 0;
  let candidateRegistry = {};
  let phamAutoWalk = false;
  let phamWalkButtonRect = null;
  let stoneTouchButtonRect = null;
  let cameraOffset = { x: 0, y: 0 };
  let targetCameraOffset = { x: 0, y: 0 };
  let screenShake = 0;
  let swordTrail = [];
  let shockwave = { active: false, x: 0, y: 0, radius: 0, maxR: 64, alpha: 1 };
  let dustParticles = [];
  let spiritualPillars = [];
  let chaoticMotes = [];
  let observationStone = {
    visible: false,
    alpha: 0,
    scale: 0,
    z: 0,
    beamAlpha: 0,
    state: STONE_STATES.IDLE,
    stateTimer: 0,
    activeRoot: null, // 'five_intro', 'npc', 'tam_linh_can', 'ngu_tap_can'
    glowColor: null,
    rumble: 0
  };

  let lucNhamEntity = {
    visible: false,
    mode: 'fly_in', // 'fly_in', 'hover', 'ground', 'takeoff', 'fly_away'
    x: 1080,
    y: 160,
    z: 280,
    vx: -180,
    vy: 120,
    vz: -160,
    swordScale: 1,
    swordSheathed: false,
    facing: 1,
    casting: false,
    capeWave: 0,
    auraAlpha: 0.8
  };

  // -------------------------------------------------------------
  // AUDIO SYNTHESIZER (WEB AUDIO API TÍCH HỢP CHO TIÊN KIẾM & PHÁP KHÍ)
  // -------------------------------------------------------------
  function getAudioCtx() {
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
    } catch (e) {
      // Ignore audio init errors
    }
    return null;
  }

  function playSwordCrySound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      const filter = actx.createBiquadFilter();

      // Tiếng kiếm ngân êm dịu, loại bỏ tần số rít chói tai
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.9);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.value = 1.0;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(actx.destination);

      osc.start(now);
      osc.stop(now + 0.95);
    } catch (e) {}
  }

  function playLandingShockSound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(actx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {}
  }

  function playStoneSummonSound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      [220, 330, 440].forEach((freq, i) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        const filter = actx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, now + i * 0.1);
        filter.Q.value = 0.7;
        gain.gain.setValueAtTime(0.001, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.04, now + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.7);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(actx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.75);
      });
    } catch (e) {}
  }

  function playTamLinhCanSound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      // 3 nốt ngân vang: Hỏa (D5), Thổ (A4), Thủy (F5)
      [440, 587.33, 698.46].forEach((f, i) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.12);
        gain.gain.setValueAtTime(0.12, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 1.8);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 1.85);
      });
    } catch (e) {}
  }

  function playNguTapCanSound() {
    const actx = getAudioCtx();
    if (!actx || actx.state === 'suspended') return;
    try {
      const now = actx.currentTime;
      // 5 nốt yếu ớt, ngắt quãng
      [293.66, 329.63, 349.23, 392.00, 440.00].forEach((f, i) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.09);
        gain.gain.setValueAtTime(0.04, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.4);
      });
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // LƯU & TẢI TRẠNG THÁI
  // -------------------------------------------------------------
  function loadState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1) {
            questData = { ...questData, ...parsed };
            if (questData.state === STATES.CINEMATIC_ACTIVE) {
              questData.state = STATES.SELECTION_READY;
            }
            if (questData.approachDelay === undefined) {
              questData.approachDelay = questData.state === STATES.CHIEF_APPROACHING ? 30.0 : 0;
            }
          }
        }
      }
    } catch (e) {}
  }

  function saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(questData));
      }
    } catch (e) {}
  }

  loadState();

  // -------------------------------------------------------------
  // HỘI THOẠI HỒI 1 (LỜI BÁO CỦA TRƯỞNG LÀNG)
  // -------------------------------------------------------------
  const SCRIPT_AFTER_REGISTER = [
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Được! Tên ngươi đã được lão phu ghi lại.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Nhớ kỹ, hai ngày nữa, khi tiếng chuông vang lên tại quảng trường làng, chính là lúc tiên nhân giáng lâm.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Đến lúc đó, dù có gặp chuyện gì cũng phải giữ tâm bình khí tĩnh, chớ làm điều thất lễ trước mặt tiên nhân.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Đi đi, nhóc con. Hãy tận hưởng những ngày bình yên còn lại. Biết đâu chẳng bao lâu nữa, cuộc đời ngươi sẽ hoàn toàn thay đổi...',
      onFinish: () => {
        completeRegistration();
      }
    }
  ];

  const SCRIPT_BRANCH_EAGER = [
    {
      speaker: 'Tiểu Phàm',
      role: 'Thiếu Niên · 14 tuổi',
      avatar: AVATARS.tieuPham,
      text: 'Tu tiên ư? Ta muốn! Ta muốn trở thành tiên nhân, ngự kiếm bay khắp thiên hạ!'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Ha ha ha! Khá lắm! Tuổi còn nhỏ mà đã có chí khí lớn như vậy, quả nhiên lão phu không nhìn lầm ngươi!'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Nhưng nhóc con, tiên đạo nào có dễ dàng như lời ngươi nói. Thiên hạ phàm nhân nhiều vô kể, kẻ có linh căn lại chẳng được bao nhiêu.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Có điều, chưa thử thì sao biết được? Biết đâu trong cái làng nhỏ bé này, lại xuất hiện một vị tiên nhân danh chấn thiên hạ!'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Được rồi! Lão phu sẽ ghi tên ngươi vào danh sách tuyển chọn. Mấy ngày tới nhớ chuẩn bị cho tốt!'
    },
    ...SCRIPT_AFTER_REGISTER
  ];

  const SCRIPT_BRANCH_HESITANT = [
    {
      speaker: 'Tiểu Phàm',
      role: 'Thiếu Niên · 14 tuổi',
      avatar: AVATARS.tieuPham,
      text: 'Nếu ta thật sự được tiên nhân thu nhận, liệu sau này còn có thể trở về làng không?'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Haizz, nhóc con, ngươi còn nhỏ mà đã biết lưu luyến cố hương rồi sao?'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Tiên lộ xa xôi, một khi bước chân vào tiên môn, có lẽ mười năm, trăm năm, thậm chí lâu hơn nữa mới có dịp trở về.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Đến lúc ấy, cảnh vật có thể vẫn còn, nhưng những người quen biết ngươi hôm nay... chưa chắc đã còn trên nhân thế.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Lão phu không muốn giấu ngươi. Tu tiên là cơ duyên, nhưng cũng là một con đường đầy cô độc.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Có điều, chim non rồi cũng phải rời tổ. Nếu ngươi thật sự có tiên duyên, lão phu mong ngươi đừng vì lưu luyến ngôi làng nhỏ bé này mà bỏ lỡ cả một đời.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Dù ngươi lựa chọn thế nào, nơi đây vẫn là quê hương của ngươi.',
      choices: [
        {
          id: 'step_forward',
          label: '“Ta đã quyết định, ta muốn bước lên tiên lộ.”',
          onSelect: () => {
            startDialogue([
              {
                speaker: 'Tiểu Phàm',
                role: 'Thiếu Niên · 14 tuổi',
                avatar: AVATARS.tieuPham,
                text: 'Ta đã quyết định, ta muốn bước lên tiên lộ.'
              },
              {
                speaker: 'Trưởng làng',
                role: 'Bậc Trưởng Bối · 60 tuổi',
                avatar: AVATARS.truong,
                text: 'Khá lắm! Tuổi trẻ phải có dũng khí bước ra thế giới bao la, lão phu sẽ ghi tên ngươi!'
              },
              ...SCRIPT_AFTER_REGISTER
            ]);
          }
        },
        {
          id: 'not_ready',
          label: '“Ta vẫn chưa sẵn sàng rời khỏi nơi này.”',
          onSelect: () => {
            startDialogue([
              {
                speaker: 'Tiểu Phàm',
                role: 'Thiếu Niên · 14 tuổi',
                avatar: AVATARS.tieuPham,
                text: 'Ta vẫn chưa sẵn sàng rời khỏi nơi này.'
              },
              {
                speaker: 'Trưởng làng',
                role: 'Bậc Trưởng Bối · 60 tuổi',
                avatar: AVATARS.truong,
                text: 'Được rồi, chuyện trọng đại cả đời, ngươi cứ suy nghĩ kỹ đi. Trước khi tiên nhân đến, bất cứ lúc nào đổi ý đều có thể tìm lão phu.',
                onFinish: () => {
                  questData.state = STATES.CONSIDERING;
                  questData.choice = 'considering';
                  saveState();
                  closeDialogue();
                }
              }
            ]);
          }
        }
      ]
    }
  ];

  const SCRIPT_BRANCH_DECLINE = [
    {
      speaker: 'Tiểu Phàm',
      role: 'Thiếu Niên · 14 tuổi',
      avatar: AVATARS.tieuPham,
      text: 'Ta chẳng muốn làm tiên nhân. Sống một đời bình yên trong làng chẳng phải tốt hơn sao?'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Ồ? Ha ha ha! Không ngờ nhóc con ngươi lại có suy nghĩ như vậy.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Người đời tranh nhau cầu tiên vấn đạo, mong được trường sinh bất tử. Còn ngươi, cơ duyên đặt ngay trước mắt lại chẳng chút động lòng.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Nhưng ngẫm kỹ, sống một đời bình an, ngày ngày ngắm mặt trời mọc, tối về quây quần bên bếp lửa, cũng chưa chắc đã kém cuộc sống của tiên nhân.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Tiên nhân có nỗi khổ của tiên nhân, phàm nhân cũng có niềm vui của phàm nhân.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Thôi được, lão phu không ép ngươi.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Chỉ là... nếu một ngày nào đó ngươi thay đổi ý định, hãy đến tìm lão phu. Trước khi tiên nhân rời làng, cơ duyên này vẫn còn.',
      onFinish: () => {
        questData.state = STATES.DECLINED;
        questData.choice = 'declined';
        saveState();
        closeDialogue();
      }
    }
  ];

  const SCRIPT_OPENING = [
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Nhóc con! Nhóc con! Mau lại đây, lão phu có chuyện quan trọng muốn nói với ngươi!'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Ngươi đã từng nghe nói đến tiên nhân chưa? Những người có thể ngự kiếm phi thiên, dời non lấp biển, thậm chí sống đến hàng nghìn năm ấy!'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Lão phu vừa nhận được tin, hai ngày nữa sẽ có tiên nhân từ tiên môn giáng lâm xuống làng ta, tuyển chọn đệ tử có linh căn.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Đây chính là cơ duyên trăm năm khó gặp! Thế nào, nhóc con, ngươi có muốn thử bước lên tiên lộ không?',
      choices: [
        {
          id: 'eager',
          label: '“Tu tiên ư? Ta muốn! Ta muốn trở thành tiên nhân, ngự kiếm bay khắp thiên hạ!”',
          onSelect: () => startDialogue(SCRIPT_BRANCH_EAGER)
        },
        {
          id: 'hesitant',
          label: '“Nếu ta thật sự được tiên nhân thu nhận, liệu sau này còn có thể trở về làng không?”',
          onSelect: () => startDialogue(SCRIPT_BRANCH_HESITANT)
        },
        {
          id: 'decline',
          label: '“Ta chẳng muốn làm tiên nhân. Sống một đời bình yên trong làng chẳng phải tốt hơn sao?”',
          onSelect: () => startDialogue(SCRIPT_BRANCH_DECLINE)
        }
      ]
    }
  ];

  function getRevisitScript() {
    if (questData.state === STATES.COMPLETED || questData.completed) {
      return [
        {
          speaker: 'Trưởng làng',
          role: 'Bậc Trưởng Bối · 60 tuổi',
          avatar: AVATARS.truong,
          text: 'Nhóc con, A Huy đã theo tiên sư rời làng rồi. Ngươi đừng buồn, con đường của mỗi người mỗi khác, cứ vững tâm sống tốt phần mình.',
          onFinish: () => closeDialogue()
        }
      ];
    }

    if (questData.state === STATES.SELECTION_READY) {
      return [
        {
          speaker: 'Trưởng làng',
          role: 'Bậc Trưởng Bối · 60 tuổi',
          avatar: AVATARS.truong,
          text: 'Nhóc con! Mau đến quảng trường! Tiên nhân sắp giáng lâm rồi, đừng để lỡ đại sự!',
          onFinish: () => closeDialogue()
        }
      ];
    }

    if (questData.state === STATES.REGISTERED || questData.state === STATES.AWAITING_SELECTION) {
      return [
        {
          speaker: 'Trưởng làng',
          role: 'Bậc Trưởng Bối · 60 tuổi',
          avatar: AVATARS.truong,
          text: 'Nhóc con, tên ngươi đã có trong danh sách. Chớ sốt ruột, cứ chuẩn bị tinh thần cho tốt.',
          onFinish: () => closeDialogue()
        }
      ];
    }

    if (questData.state === STATES.CONSIDERING) {
      return [
        {
          speaker: 'Trưởng làng',
          role: 'Bậc Trưởng Bối · 60 tuổi',
          avatar: AVATARS.truong,
          text: 'Nhóc con, chuyện tiên duyên ngươi đã suy nghĩ kỹ chưa? Lão phu không ép, nhưng cơ duyên chẳng chờ ai mãi đâu.',
          choices: [
            {
              id: 'change_mind_register',
              label: '“Ta đã suy nghĩ kỹ, ta muốn ghi tên tham gia tuyển chọn!”',
              onSelect: () => {
                startDialogue([
                  {
                    speaker: 'Tiểu Phàm',
                    role: 'Thiếu Niên · 14 tuổi',
                    avatar: AVATARS.tieuPham,
                    text: 'Ta đã suy nghĩ kỹ, ta muốn ghi tên tham gia tuyển chọn!'
                  },
                  {
                    speaker: 'Trưởng làng',
                    role: 'Bậc Trưởng Bối · 60 tuổi',
                    avatar: AVATARS.truong,
                    text: 'Tốt lắm! Lão phu sẽ ghi tên ngươi vào danh sách ngay!'
                  },
                  ...SCRIPT_AFTER_REGISTER
                ]);
              }
            },
            {
              id: 'keep_considering',
              label: '“Xin cho ta thêm thời gian suy nghĩ.”',
              onSelect: () => {
                startDialogue([
                  {
                    speaker: 'Tiểu Phàm',
                    role: 'Thiếu Niên · 14 tuổi',
                    avatar: AVATARS.tieuPham,
                    text: 'Xin cho ta thêm thời gian suy nghĩ.'
                  },
                  {
                    speaker: 'Trưởng làng',
                    role: 'Bậc Trưởng Bối · 60 tuổi',
                    avatar: AVATARS.truong,
                    text: 'Được, chuyện hệ trọng, cứ thong thả suy nghĩ.',
                    onFinish: () => closeDialogue()
                  }
                ]);
              }
            }
          ]
        }
      ];
    }

    if (questData.state === STATES.DECLINED) {
      return [
        {
          speaker: 'Trưởng làng',
          role: 'Bậc Trưởng Bối · 60 tuổi',
          avatar: AVATARS.truong,
          text: 'Ồ, nhóc con lại đến tìm lão phu sao? Thế nào, đã đổi ý muốn thử tiên duyên rồi ư?',
          choices: [
            {
              id: 'change_mind_register_declined',
              label: '“Ta muốn thử, xin trưởng làng ghi tên ta vào danh sách!”',
              onSelect: () => {
                startDialogue([
                  {
                    speaker: 'Tiểu Phàm',
                    role: 'Thiếu Niên · 14 tuổi',
                    avatar: AVATARS.tieuPham,
                    text: 'Ta muốn thử, xin trưởng làng ghi tên ta vào danh sách!'
                  },
                  {
                    speaker: 'Trưởng làng',
                    role: 'Bậc Trưởng Bối · 60 tuổi',
                    avatar: AVATARS.truong,
                    text: 'Ha ha ha! Biết quay đầu là tốt! Cơ duyên trăm năm có một này suýt nữa thì ngươi bỏ lỡ!'
                  },
                  ...SCRIPT_AFTER_REGISTER
                ]);
              }
            },
            {
              id: 'just_greeting',
              label: '“Ta chỉ ghé qua chào hỏi lão bá thôi.”',
              onSelect: () => {
                startDialogue([
                  {
                    speaker: 'Tiểu Phàm',
                    role: 'Thiếu Niên · 14 tuổi',
                    avatar: AVATARS.tieuPham,
                    text: 'Ta chỉ ghé qua chào hỏi lão bá thôi.'
                  },
                  {
                    speaker: 'Trưởng làng',
                    role: 'Bậc Trưởng Bối · 60 tuổi',
                    avatar: AVATARS.truong,
                    text: 'Ừ, nhóc con cứ thong thả dạo chơi trong làng.',
                    onFinish: () => closeDialogue()
                  }
                ]);
              }
            }
          ]
        }
      ];
    }

    return SCRIPT_OPENING;
  }

  function completeRegistration() {
    const curDay = typeof Villagers !== 'undefined' && Villagers.day ? Villagers.day : 1;
    questData.state = STATES.REGISTERED;
    questData.choice = 'registered';
    questData.registeredDay = curDay;
    saveState();
    closeDialogue();
    showToast(
      'Nhiệm vụ đã nhận: Tiên Duyên Khởi Đầu\nMục tiêu: Chờ hai ngày, đến quảng trường làng tham gia tuyển chọn linh căn.'
    );
  }

  function showToast(msg) {
    toastMessage = msg;
    toastTimer = 6.0;

    const toastEl = document.getElementById('quest-toast');
    if (toastEl) {
      toastEl.hidden = false;
      const lines = msg.split('\n');
      const titleEl = document.getElementById('quest-toast-title');
      const bodyEl = document.getElementById('quest-toast-body');
      if (titleEl) titleEl.textContent = lines[0] || '';
      if (bodyEl) bodyEl.textContent = lines.slice(1).join('\n') || '';
      toastEl.style.opacity = '1';
    }
  }

  function showResultCard(info) {
    const card = document.getElementById('quest-result-card');
    if (!card) return;
    const nameEl = document.getElementById('result-name');
    const rootEl = document.getElementById('result-root');
    const typeEl = document.getElementById('result-type');
    const gradeEl = document.getElementById('result-grade');

    if (nameEl) nameEl.textContent = info.name || '';
    if (rootEl) rootEl.textContent = info.root || '';
    if (typeEl) typeEl.textContent = info.type || '';
    if (gradeEl) gradeEl.textContent = info.grade || '';

    // Kết quả được lưu và được tiên nhân đọc trong hội thoại,
    // không mở khung giữa màn hình che Quan Trắc Thạch.
    card.hidden = true;
  }

  function hideResultCard() {
    const card = document.getElementById('quest-result-card');
    if (card) {
      card.hidden = true;
    }
  }

  // -------------------------------------------------------------
  // DIALOGUE UI CONTROLLER (TYPEWRITER, CHOICES, NEXT)
  // -------------------------------------------------------------
  function startDialogue(script) {
    if (!script || !script.length) return;
    currentScript = script;
    scriptIndex = 0;
    dialogueActive = true;
    questData.hasMetChief = true;
    saveState();

    // Face each other
    if (cachedChief && typeof p !== 'undefined') {
      cachedChief.route = [];
      cachedChief.walk = 0;
      cachedChief.dir = p.x > cachedChief.x ? 1 : -1;
      p.walk = 0;
    }

    renderCurrentStep();
  }

  function resolveAvatar(step) {
    if (!step) return AVATARS.truong;
    const speaker = (step.speaker || '').trim();
    if (speaker === 'Tiểu Phàm' || speaker === 'Trương Tiểu Phàm') {
      return AVATARS.tieuPham;
    }
    if (speaker === 'A Huy') {
      return AVATARS.aHuy;
    }
    if (speaker === 'Lục Nham') {
      return AVATARS.lucNham;
    }
    if (speaker === 'Trưởng làng') {
      return AVATARS.truong;
    }
    return step.avatar || AVATARS.truong;
  }

  function renderCurrentStep() {
    if (scriptIndex >= currentScript.length) {
      closeDialogue();
      return;
    }

    const step = currentScript[scriptIndex];
    const container = document.getElementById('quest-dialog');
    const speakerEl = document.getElementById('quest-speaker-name');
    const roleEl = document.getElementById('quest-speaker-role');
    const avatarEl = document.getElementById('quest-avatar');
    const textEl = document.getElementById('quest-dialog-text');
    const promptEl = document.getElementById('quest-prompt-tap');
    const choicesEl = document.getElementById('quest-choices');

    if (!container || !textEl) {
      return;
    }

    container.hidden = false;
    if (speakerEl) speakerEl.textContent = step.speaker;
    if (roleEl) roleEl.textContent = step.role || '';
    if (avatarEl) {
      const targetAvatar = resolveAvatar(step);
      avatarEl.src = targetAvatar;
      avatarEl.alt = step.speaker;
      avatarEl.onerror = () => {
        if (step.speaker === 'Tiểu Phàm' || step.speaker === 'Trương Tiểu Phàm') {
          avatarEl.src = 'tieu-pham-avatar.webp';
        } else if (step.speaker === 'Trưởng làng') {
          avatarEl.src = 'Truong_Lang_Avatar_9KB.webp';
        } else if (step.speaker === 'Lục Nham') {
          avatarEl.src = 'luc-nham-avatar.webp';
        }
      };
      if (avatarEl.classList && avatarEl.classList.remove) {
        avatarEl.classList.remove('quest-avatar-enter');
        if (avatarEl.offsetWidth !== undefined) void avatarEl.offsetWidth;
        avatarEl.classList.add('quest-avatar-enter');
      }
    }
    if (textEl && textEl.classList && textEl.classList.remove) {
      textEl.classList.remove('quest-text-fadeIn');
      if (textEl.offsetWidth !== undefined) void textEl.offsetWidth;
      textEl.classList.add('quest-text-fadeIn');
    }

    // Prepare typewriter
    fullText = step.text;
    displayedText = '';
    typeIndex = 0;
    isTyping = true;
    textEl.textContent = '';
    if (promptEl) promptEl.hidden = true;
    if (choicesEl) {
      choicesEl.hidden = true;
      choicesEl.innerHTML = '';
    }

    if (typeof clearInterval !== 'undefined') clearInterval(typeTimer);
    if (typeof setInterval !== 'undefined') {
      typeTimer = setInterval(() => {
        if (typeIndex < fullText.length) {
          typeIndex++;
          displayedText = fullText.slice(0, typeIndex);
          textEl.textContent = displayedText;
        } else {
          finishTyping();
        }
      }, 24);
    } else {
      finishTyping();
    }
  }

  function finishTyping() {
    if (!isTyping) return;
    if (typeof clearInterval !== 'undefined') clearInterval(typeTimer);
    isTyping = false;
    displayedText = fullText;

    const textEl = document.getElementById('quest-dialog-text');
    const promptEl = document.getElementById('quest-prompt-tap');
    const choicesEl = document.getElementById('quest-choices');
    if (textEl) textEl.textContent = fullText;

    const step = currentScript[scriptIndex];
    if (step && step.choices && step.choices.length) {
      if (promptEl) promptEl.hidden = true;
      if (choicesEl) {
        choicesEl.hidden = false;
        choicesEl.innerHTML = '';
        step.choices.forEach((c) => {
          const btn = document.createElement('button');
          btn.className = 'quest-choice-btn';
          btn.textContent = c.label;
          btn.onclick = (e) => {
            e.stopPropagation();
            c.onSelect();
          };
          choicesEl.appendChild(btn);
        });
      }
    } else {
      if (promptEl) promptEl.hidden = false;
    }
  }

  function handleBoxClick() {
    if (!dialogueActive) return;
    if (isTyping) {
      finishTyping();
      return;
    }
    const step = currentScript[scriptIndex];
    if (step && step.choices && step.choices.length) {
      return;
    }

    if (step && typeof step.onFinish === 'function') {
      step.onFinish();
      return;
    }

    scriptIndex++;
    if (scriptIndex < currentScript.length) {
      renderCurrentStep();
    } else {
      closeDialogue();
    }
  }

  function closeDialogue() {
    if (typeof clearInterval !== 'undefined') clearInterval(typeTimer);
    isTyping = false;
    dialogueActive = false;
    currentScript = [];
    scriptIndex = 0;

    const container = document.getElementById('quest-dialog');
    if (container) container.hidden = true;

    if (cachedChief) {
      cachedChief.pause = 1.0;
    }
  }

  // -------------------------------------------------------------
  // HỆ THỐNG ĐIỀU KHIỂN ĐỘI HÌNH 4 KHU VỰC & TRẠNG THÁI THIẾU NIÊN
  // -------------------------------------------------------------
  function initCandidateRegistry() {
    candidateRegistry = {};
    TEENAGER_QUEUE_SLOTS.forEach((slot) => {
      candidateRegistry[slot.id] = {
        id: slot.id,
        name: slot.name,
        status: CANDIDATE_STATES.WAITING,
        queuePos: { x: slot.x, y: slot.y },
        exitPos: { x: slot.exitX, y: slot.exitY },
        waypoints: [],
        testable: slot.testable,
        testedCount: 0
      };
    });
  }

  initCandidateRegistry();

  function walkActorAlongWaypoints(actor, waypoints, speed, dt, t) {
    if (!actor || !waypoints || !waypoints.length) return true;
    let budget = speed * dt;
    while (budget > 0 && waypoints.length) {
      const target = waypoints[0];
      const dx = target.x - actor.x;
      const dy = target.y - actor.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 1.5) {
        actor.x = target.x;
        actor.y = target.y;
        waypoints.shift();
        continue;
      }
      const stepLen = Math.min(dist, budget);
      const nx = actor.x + (dx / dist) * stepLen;
      const ny = actor.y + (dy / dist) * stepLen;
      actor.x = nx;
      actor.y = ny;
      budget -= stepLen;
      if (Math.abs(dx) > 0.3) {
        actor.dir = dx >= 0 ? 1 : -1;
      }
      actor.walk = (t || 1) * 10;
      if (stepLen >= dist - 1.5) {
        actor.x = target.x;
        actor.y = target.y;
        waypoints.shift();
      }
    }
    if (!waypoints.length) {
      actor.walk = 0;
      return true;
    }
    return false;
  }

  function buildWaypointsToStone(startX, startY) {
    const pts = [];
    // Nếu đứng ở hàng 2 (y >= 590), đi qua hành lang trống giữa hàng (x = 676) để không chạm ai
    if (startY > 580) {
      pts.push({ x: 676, y: 552 });
    } else if (Math.abs(startX - TEST_STAND_POS.x) > 25) {
      pts.push({ x: startX, y: 542 });
    }
    pts.push({ x: TEST_STAND_POS.x, y: TEST_STAND_POS.y });
    return pts;
  }

  function buildWaypointsToExit(startX, startY, exitX, exitY) {
    const pts = [];
    if (exitX < TEST_STAND_POS.x) {
      pts.push({ x: 585, y: 518 });
      pts.push({ x: exitX, y: exitY });
    } else {
      pts.push({ x: 745, y: 505 });
      pts.push({ x: exitX, y: exitY });
    }
    return pts;
  }

  function arrangeSquareSquad(villagers, resetRegistry = false) {
    if (!villagers || !villagers.list) return false;
    if (resetRegistry || !Object.keys(candidateRegistry).length) {
      initCandidateRegistry();
    }

    const inCinematic = questData.state === STATES.CINEMATIC_ACTIVE;

    // KHU A — Vị trí chủ trì (phía trên vòng tròn hoa văn: Lục Nham bên trái, Trưởng làng bên phải)
    if (cachedChief) {
      cachedChief.state = 'ceremony';
      cachedChief.hidden = false;
      cachedChief.x = CHIEF_SQUARE_POS.x;
      cachedChief.y = CHIEF_SQUARE_POS.y;
      cachedChief.dir = -1; // Hướng về trung tâm & hàng thiếu niên
      cachedChief.route = [];
      cachedChief.walk = 0;
      cachedChief.pause = 9999;
      cachedChief.reachingStone = false;
      cachedChief.showCeremonyName = true;
    }

    // KHU C — Hàng thiếu niên (xếp thành hàng ngay ngắn phía dưới vòng tròn)
    TEENAGER_QUEUE_SLOTS.forEach((slot) => {
      const reg = candidateRegistry[slot.id];
      const status = reg ? reg.status : CANDIDATE_STATES.WAITING;

      if (slot.id === 'aHuy') {
        if (typeof AHuy !== 'undefined') {
          AHuy.hidden = false;
          if (!inCinematic || status === CANDIDATE_STATES.WAITING) {
            AHuy.takeScenePosition(slot.x, slot.y, -1);
            AHuy.reachingStone = false;
            AHuy.showCeremonyName = cinematicStep === 1;
          } else if (status === CANDIDATE_STATES.EXITED && cinematicStep < 8) {
            AHuy.takeScenePosition(reg.exitPos.x, reg.exitPos.y, -1);
            AHuy.reachingStone = false;
            AHuy.showCeremonyName = false;
          }
        }
        return;
      }

      if (slot.id === 'tieuPham') {
        return;
      }

      const npc = villagers.list.find((n) => n.id === slot.id);
      if (npc) {
        npc.state = 'ceremony';
        npc.hidden = false;
        npc.route = [];
        npc.pause = 9999;
        if (!inCinematic || status === CANDIDATE_STATES.WAITING) {
          npc.x = slot.x;
          npc.y = slot.y;
          npc.dir = slot.x <= SQUARE_CENTER.x ? 1 : -1;
          npc.walk = 0;
          npc.reachingStone = false;
          npc.showCeremonyName = false;
        } else if (status === CANDIDATE_STATES.EXITED) {
          npc.x = reg.exitPos.x;
          npc.y = reg.exitPos.y;
          npc.dir = 1;
          npc.walk = 0;
          npc.reachingStone = false;
          npc.showCeremonyName = false;
        }
      }
    });

    // KHU D — Dân làng: Nông dân đứng riêng bên trái ngoài quảng trường, người lớn tuổi & dân làng đứng bên phải
    FARMER_WATCH_SLOTS.forEach((slot) => {
      const npc = villagers.list.find((n) => n.id === slot.id);
      if (npc) {
        npc.state = 'ceremony';
        npc.hidden = false;
        npc.x = slot.x;
        npc.y = slot.y;
        npc.dir = slot.dir;
        npc.route = [];
        npc.walk = 0;
        npc.pause = 9999;
        npc.reachingStone = false;
        npc.showCeremonyName = false;
      }
    });

    VILLAGER_WATCH_SLOTS.forEach((slot) => {
      const npc = villagers.list.find((n) => n.id === slot.id);
      if (npc) {
        npc.state = 'ceremony';
        npc.hidden = false;
        npc.x = slot.x;
        npc.y = slot.y;
        npc.dir = slot.dir;
        npc.route = [];
        npc.walk = 0;
        npc.pause = 9999;
        npc.reachingStone = false;
        npc.showCeremonyName = false;
      }
    });

    return true;
  }

  function orientCrowdToCenter(villagers) {
    if (!villagers || !villagers.list) return;
    villagers.list.forEach((n) => {
      if (n.state === 'ceremony' && !n.hidden) {
        n.dir = n.x <= STONE_POS.x ? 1 : -1;
      }
    });
    if (typeof AHuy !== 'undefined' && !AHuy.hidden) {
      const ahReg = candidateRegistry.aHuy;
      if (!ahReg || ahReg.status === CANDIDATE_STATES.WAITING) {
        AHuy.takeScenePosition(AHUY_SQUARE_POS.x, AHUY_SQUARE_POS.y, -1);
      }
    }
  }

  function verifySquadPositions(villagers) {
    if (!villagers || !villagers.list) return false;
    arrangeSquareSquad(villagers, false);
    return true;
  }

  function startCinematic(player, villagers) {
    questData.state = STATES.CINEMATIC_ACTIVE;
    cinematicStep = 1;
    cinematicTimer = 0;
    stepSubPhase = 'init';
    stepSubTimer = 0;
    currentCandidateIdx = 0;
    phamAutoWalk = false;
    saveState();

    arrangeSquareSquad(villagers, true);
    verifySquadPositions(villagers);

    // Đưa Tiểu Phàm vào đúng vị trí hàng thiếu niên (Khu C)
    player.x = PHAM_SQUARE_POS.x;
    player.y = PHAM_SQUARE_POS.y;
    player.dir = 'up';
    player.walk = 0;
    player.reachingStone = false;
    if (typeof p !== 'undefined' && p) {
      p.x = PHAM_SQUARE_POS.x;
      p.y = PHAM_SQUARE_POS.y;
      p.dir = 'up';
      p.walk = 0;
      p.reachingStone = false;
    }
    if (typeof TieuPhamHome !== 'undefined' && TieuPhamHome.inside) {
      TieuPhamHome.inside = false;
    }

    // Đặt góc máy nhìn bao quát quảng trường & không bị hộp thoại che khuất
    targetCameraOffset = { x: 0, y: -38 };
    cameraOffset = { x: 0, y: -38 };

    // PHÂN CẢNH 1: HỘI THOẠI MỞ ĐẦU KHI TẬP TRUNG ĐỘI HÌNH
    startDialogue([
      {
        speaker: 'Trưởng làng',
        role: 'Bậc Trưởng Bối · 60 tuổi',
        avatar: AVATARS.truong,
        text: 'Các vị hương thân! Hôm nay là ngày trọng đại của làng chúng ta. Tiên nhân từ tiên môn sắp giáng lâm, mong mọi người đứng đúng vị trí, giữ trật tự, chớ gây ồn ào!'
      },
      {
        speaker: 'A Huy',
        role: 'Bạn cùng tuổi · 14 tuổi',
        avatar: AVATARS.aHuy,
        text: 'Tiểu Phàm, ngươi cũng đến rồi à? Hừ, hôm nay ta nhất định phải được tiên nhân thu nhận. Đến lúc đó, ngươi đừng có mà ghen tị đấy!'
      },
      {
        speaker: 'Tiểu Phàm',
        role: 'Thiếu Niên · 14 tuổi',
        avatar: AVATARS.tieuPham,
        text: 'Còn chưa khảo nghiệm, sao ngươi biết mình sẽ được chọn?'
      },
      {
        speaker: 'A Huy',
        role: 'Bạn cùng tuổi · 14 tuổi',
        avatar: AVATARS.aHuy,
        text: 'Cứ chờ xem!',
        onFinish: () => {
          closeDialogue();
          if (typeof AHuy !== 'undefined') AHuy.showCeremonyName = false;
          // Tiếng kiếm minh vang lên
          playSwordCrySound();
          cinematicStep = 2; // Chuyển sang ngự kiếm giáng lâm tại Khu A (bên trái Trưởng làng)
          cinematicTimer = 0;
          stepSubPhase = 'flying';
          stepSubTimer = 0;
          lucNhamEntity.visible = true;
          lucNhamEntity.mode = 'fly_in';
          lucNhamEntity.swordSheathed = false;
          lucNhamEntity.casting = false;
          lucNhamEntity.x = 1040;
          lucNhamEntity.y = 140;
          lucNhamEntity.z = 300;
          targetCameraOffset = { x: -12, y: -88 };
        }
      }
    ]);
  }

  // -------------------------------------------------------------
  // DANH SÁCH KHẢO NGHIỆM TUẦN TỰ (PHÂN CẢNH 4)
  // -------------------------------------------------------------
  const NPC_TEST_QUEUE = [
    {
      id: 'an',
      name: 'Tiểu An',
      callLine: 'Người đầu tiên, Tiểu An, tiến lên khảo nghiệm linh căn!',
      resultLine: 'Không có linh căn. Lùi sang khu vực bên trái, người tiếp theo.'
    },
    {
      id: 'minh',
      name: 'Tiểu Minh',
      callLine: 'Người thứ hai, Tiểu Minh, tiến lên trước Quan Trắc Thạch!',
      resultLine: 'Linh khí quá yếu, không đạt yêu cầu. Người tiếp theo.'
    },
    {
      id: 'cuc',
      name: 'Bé Cúc',
      callLine: 'Người tiếp theo, Bé Cúc, bước lên khảo nghiệm!',
      resultLine: 'Đáng tiếc, ngươi không có tư chất nhập đạo. Lui xuống đi.'
    }
  ];

  // -------------------------------------------------------------
  // UPDATE VÀ RENDER GAME LOOP
  // -------------------------------------------------------------
  function init(villagers) {
    if (!villagers || !villagers.list) return;
    cachedVillagers = villagers;
    cachedChief = villagers.list.find((n) => n.id === 'truong');

    const container = document.getElementById('quest-dialog');
    if (container) container.onclick = handleBoxClick;
    const nextBtn = document.getElementById('quest-prompt-tap');
    if (nextBtn) nextBtn.onclick = handleBoxClick;

    if (questData.state === STATES.CHIEF_APPROACHING && cachedChief) {
      cachedChief.x = 480;
      cachedChief.y = 350;
      cachedChief.home = [480, 350];
      cachedChief.dir = -1;
      cachedChief.route = [];
      cachedChief.walk = 0;
      cachedChief.pause = 0;
      cachedChief.spokenLine = '';
    }

    if (questData.state === STATES.COMPLETED || questData.completed) {
      if (typeof AHuy !== 'undefined') {
        AHuy.hidden = true;
        AHuy.reachingStone = false;
        AHuy.showCeremonyName = false;
      }
      if (villagers && typeof villagers.disbandCeremony === 'function') {
        villagers.disbandCeremony();
      } else if (villagers && villagers.list) {
        villagers.list.forEach((n) => {
          if (n.state === 'ceremony' || n.pause >= 1000) {
            n.state = '';
            n.pause = 0;
            n.reachingStone = false;
            n.showCeremonyName = false;
            n.route = [];
            n.arrived = false;
            if (villagers.plan) villagers.plan(n);
          }
        });
      }
    }

    ensureStoneSpritesLoaded();
    initialized = true;
  }

  function update(dt, t, player, villagers) {
    if (!initialized && villagers) init(villagers);
    if (!cachedChief && villagers && villagers.list) {
      cachedChief = villagers.list.find((n) => n.id === 'truong');
    }
    cachedVillagers = villagers;
    cachedPlayer = player;

    if (questData.state === STATES.COMPLETED || questData.completed) {
      if (typeof AHuy !== 'undefined') {
        AHuy.hidden = true;
        AHuy.reachingStone = false;
        AHuy.showCeremonyName = false;
      }
      const vList = villagers || cachedVillagers || (typeof Villagers !== 'undefined' ? Villagers : null);
      if (vList && vList.list) {
        let hasStuck = false;
        for (let i = 0; i < vList.list.length; i++) {
          const n = vList.list[i];
          if (n.state === 'ceremony' || n.pause >= 1000 || (n.reachingStone && !dialogueActive)) {
            hasStuck = true;
            break;
          }
        }
        if (hasStuck) {
          if (typeof vList.disbandCeremony === 'function') {
            vList.disbandCeremony();
          } else {
            vList.list.forEach((n) => {
              if (n.state === 'ceremony' || n.pause >= 1000) {
                n.state = '';
                n.pause = 0;
                n.reachingStone = false;
                n.showCeremonyName = false;
                n.route = [];
                n.arrived = false;
                if (vList.plan) vList.plan(n);
              }
            });
          }
        }
      }
    }

    if (screenShake > 0) {
      screenShake = Math.max(0, screenShake - dt);
    }

    // Cập nhật ngày theo dõi (Chờ 2 ngày trong game)
    const currentDay = villagers && villagers.day ? villagers.day : 1;
    if (
      (questData.state === STATES.REGISTERED || questData.state === STATES.AWAITING_SELECTION) &&
      questData.registeredDay != null &&
      currentDay >= Math.max(3, questData.registeredDay + 2)
    ) {
      questData.state = STATES.SELECTION_READY;
      saveState();
      showToast(
        'Tiếng chuông vang vọng khắp Làng Du Lãm.\nHôm nay chính là ngày tiên nhân giáng lâm tuyển chọn đệ tử! Mau đến quảng trường!'
      );
    }

    // Toast Timer
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0) {
        const toastEl = document.getElementById('quest-toast');
        if (toastEl) toastEl.style.opacity = '0';
      }
    }

    // Khi ở trạng thái SELECTION_READY:
    // Dân làng xếp hàng ngay ngắn theo 4 khu vực tại quảng trường, Tiểu Phàm tới gần sẽ tự động kích hoạt
    if (questData.state === STATES.SELECTION_READY) {
      arrangeSquareSquad(villagers, false);

      // Nếu đang trong nhà (ngủ/nghỉ), không kích hoạt cinematic từ xa
      if (typeof TieuPhamHome !== 'undefined' && TieuPhamHome.inside) {
        return;
      }

      const distToSquare = Math.hypot(player.x - SQUARE_CENTER.x, player.y - SQUARE_CENTER.y);
      const distToLegacy = Math.hypot(player.x - LEGACY_SQUARE_CENTER.x, player.y - LEGACY_SQUARE_CENTER.y);
      if ((distToSquare <= 145 || distToLegacy <= 96) && !dialogueActive) {
        startCinematic(player, villagers);
        return;
      }
    }

    // HỒI 1: Trưởng làng tiếp cận
    if (questData.state === STATES.CHIEF_APPROACHING) {
      if (!cachedChief) return;

      // Nếu Tiểu Phàm đang ở trong nhà (ngủ/nghỉ), Trưởng làng đứng chờ ở sân trước cửa, không kích hoạt đối thoại xuyên tường
      if (typeof TieuPhamHome !== 'undefined' && TieuPhamHome.inside) {
        cachedChief.route = [];
        cachedChief.walk = 0;
        cachedChief.x = 236;
        cachedChief.y = 326;
        cachedChief.dir = -1;
        return;
      }

      // Đảm bảo Trưởng Làng luôn trong phạm vi xóm gần nhà Tiểu Phàm
      if (cachedChief.x > 750 || cachedChief.y > 600 || cachedChief.x < 180) {
        cachedChief.x = 480;
        cachedChief.y = 350;
        cachedChief.home = [480, 350];
        cachedChief.route = [];
      }

      const distToPlayer = Math.hypot(cachedChief.x - player.x, cachedChief.y - player.y);

      if (dialogueActive) {
        cachedChief.route = [];
        cachedChief.walk = 0;
        cachedChief.dir = player.x > cachedChief.x ? 1 : -1;
        return;
      }

      if (questData.approachDelay > 0) {
        questData.approachDelay = Math.max(0, questData.approachDelay - dt);
        if (questData.approachDelay === 0) saveState();

        // Trong 30s đầu: Đứng chờ tại chỗ, quay mặt về phía Tiểu Phàm
        cachedChief.route = [];
        cachedChief.walk = 0;
        cachedChief.dir = player.x > cachedChief.x ? 1 : -1;

        if (distToPlayer <= 56) {
          cachedChief.route = [];
          cachedChief.walk = 0;
          cachedChief.dir = player.x > cachedChief.x ? 1 : -1;
          cachedChief.spokenLine = 'Nhóc con! Nhóc con! Mau lại đây!';
          cachedChief.pause = 3.5;
          if (!dialogueActive) {
            questData.approachDelay = 0;
            saveState();
            startDialogue(SCRIPT_OPENING);
          }
        }
        return;
      }

      // Hết 30 giây: Trưởng làng chủ động tìm và tiến lại gần Tiểu Phàm
      if (distToPlayer <= 56) {
        cachedChief.route = [];
        cachedChief.walk = 0;
        cachedChief.dir = player.x > cachedChief.x ? 1 : -1;
        cachedChief.spokenLine = 'Nhóc con! Nhóc con! Mau lại đây!';
        cachedChief.pause = 3.5;
        if (!dialogueActive) startDialogue(SCRIPT_OPENING);
      } else {
        routeTimer -= dt;
        if (routeTimer <= 0 || !cachedChief.route || !cachedChief.route.length) {
          routeTimer = 0.8;
          if (villagers && typeof villagers.route === 'function') {
            cachedChief.route = villagers.route([cachedChief.x, cachedChief.y], [player.x, player.y]);
          }
        }

        calloutCooldown -= dt;
        if (calloutCooldown <= 0) {
          calloutCooldown = 3.5;
          cachedChief.spokenLine = 'Tiểu Phàm! Đợi lão phu một chút!';
        }

        let budget = 78 * dt;
        while (budget > 0 && cachedChief.route && cachedChief.route.length) {
          const [tx, ty] = cachedChief.route[0];
          const dx = tx - cachedChief.x,
            dy = ty - cachedChief.y;
          const len = Math.hypot(dx, dy);
          const amount = Math.min(len, budget);
          if (len < 0.1) {
            cachedChief.route.shift();
            continue;
          }
          const nx = cachedChief.x + (dx / len) * amount;
          const ny = cachedChief.y + (dy / len) * amount;
          if (typeof Collision === 'undefined' || Collision.canWalk(nx, ny)) {
            cachedChief.x = nx;
            cachedChief.y = ny;
            budget -= amount;
            cachedChief.walk = t * 9;
            if (Math.abs(dx) > 0.4) cachedChief.dir = dx < 0 ? -1 : 1;
            if (amount === len) cachedChief.route.shift();
          } else {
            if (villagers && typeof villagers.route === 'function') {
              cachedChief.route = villagers.route([cachedChief.x, cachedChief.y], [player.x, player.y]);
            }
            break;
          }
        }

        // Bước trực tiếp nếu không còn lộ trình trung gian nhưng khoảng cách vẫn > 56px
        if ((!cachedChief.route || !cachedChief.route.length) && distToPlayer > 56) {
          const directDx = player.x - cachedChief.x;
          const directDy = player.y - cachedChief.y;
          const directDist = Math.hypot(directDx, directDy);
          if (directDist > 0.1) {
            const stepLen = Math.min(directDist, 78 * dt);
            const nx = cachedChief.x + (directDx / directDist) * stepLen;
            const ny = cachedChief.y + (directDy / directDist) * stepLen;
            if (typeof Collision === 'undefined' || Collision.canWalk(nx, ny)) {
              cachedChief.x = nx;
              cachedChief.y = ny;
              cachedChief.walk = t * 9;
              if (Math.abs(directDx) > 0.4) cachedChief.dir = directDx < 0 ? -1 : 1;
            }
          }
        }
      }
      return;
    }

    // ---------------------------------------------------------
    // CẬP NHẬT TIẾN TRÌNH CINEMATIC HỒI 2
    // ---------------------------------------------------------
    if (questData.state === STATES.CINEMATIC_ACTIVE) {
      updateCinematicSequence(dt, t, player, villagers);
    }
  }

  function triggerPhamStoneTouch(player) {
    const pl = player || cachedPlayer || (typeof p !== 'undefined' ? p : null);
    if (cinematicStep !== 6) return false;
    if (stepSubPhase !== 'await_touch' && stepSubPhase !== 'player_walk' && stepSubPhase !== 'prompt_touch') {
      return false;
    }
    if (dialogueActive) closeDialogue();
    if (pl) {
      pl.x = TEST_STAND_POS.x;
      pl.y = TEST_STAND_POS.y;
      pl.dir = 'up';
      pl.walk = 0;
      pl.reachingStone = true;
    }
    if (typeof p !== 'undefined' && p) {
      p.x = TEST_STAND_POS.x;
      p.y = TEST_STAND_POS.y;
      p.dir = 'up';
      p.walk = 0;
      p.reachingStone = true;
    }
    if (candidateRegistry.tieuPham) {
      candidateRegistry.tieuPham.status = CANDIDATE_STATES.TESTING;
    }
    observationStone.state = STONE_STATES.TESTING;
    observationStone.stateTimer = 0;
    observationStone.activeRoot = null;
    stepSubPhase = 'testing';
    stepSubTimer = 0;
    targetCameraOffset = { x: 0, y: -64 };
    return true;
  }

  function updateCinematicSequence(dt, t, player, villagers) {
    cinematicTimer += dt;
    stepSubTimer += dt;
    observationStone.stateTimer += dt;

    // Giữ nguyên đội hình chuẩn cho các NPC ở trạng thái WAITING / EXITED
    arrangeSquareSquad(villagers, false);

    // Chuyển động camera mượt mà (lerp)
    const camLerp = Math.min(1, dt * 5.5);
    cameraOffset.x += (targetCameraOffset.x - cameraOffset.x) * camLerp;
    cameraOffset.y += (targetCameraOffset.y - cameraOffset.y) * camLerp;

    // Cập nhật hạt bụi xung kích
    for (let i = dustParticles.length - 1; i >= 0; i--) {
      const dp = dustParticles[i];
      dp.x += dp.vx * dt;
      dp.y += dp.vy * dt;
      dp.alpha -= dt * 1.8;
      if (dp.alpha <= 0) dustParticles.splice(i, 1);
    }

    // Cập nhật sóng xung kích
    if (shockwave.active) {
      shockwave.radius += dt * 145;
      shockwave.alpha = Math.max(0, 1 - shockwave.radius / shockwave.maxR);
      if (shockwave.radius >= shockwave.maxR) {
        shockwave.active = false;
      }
    }

    // Cập nhật vệt kiếm quang
    if (lucNhamEntity.visible && !lucNhamEntity.swordSheathed) {
      const swordX = lucNhamEntity.x;
      const swordY = lucNhamEntity.y - (lucNhamEntity.z || 0);
      swordTrail.unshift({ x: swordX, y: swordY, alpha: 0.85 });
      if (swordTrail.length > 18) swordTrail.pop();
    } else if (swordTrail.length) {
      swordTrail.shift();
    }

    // Cập nhật các cột sáng và đốm sáng
    if (spiritualPillars.length) {
      spiritualPillars.forEach((col) => {
        col.height = Math.min(col.maxH, col.height + dt * 160);
        col.glowPhase = (col.glowPhase || 0) + dt * 6;
      });
    }

    for (let i = chaoticMotes.length - 1; i >= 0; i--) {
      const m = chaoticMotes[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.alpha -= dt * 0.85;
      if (m.alpha <= 0) chaoticMotes.splice(i, 1);
    }

    // ---------------------------------------------------------
    // PHÂN CẢNH 2: LỤC NHAM NGỰ KIẾM GIÁNG LÂM TẠI KHU A (BÊN TRÁI TRƯỞNG LÀNG)
    // ---------------------------------------------------------
    if (cinematicStep === 2) {
      const targetX = LUC_NHAM_STAND.x;
      const targetY = LUC_NHAM_STAND.y;

      if (stepSubPhase === 'flying') {
        const progress = Math.min(1, cinematicTimer / 2.4);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic Ease-Out

        lucNhamEntity.x = 1040 + (targetX - 1040) * ease;
        lucNhamEntity.y = 140 + (targetY - 140) * ease;
        lucNhamEntity.z = Math.max(0, 300 * (1 - ease));

        if (progress >= 1) {
          lucNhamEntity.mode = 'ground';
          lucNhamEntity.x = targetX;
          lucNhamEntity.y = targetY;
          lucNhamEntity.z = 0;
          lucNhamEntity.facing = 1; // Hướng về trung tâm & hàng thiếu niên
          screenShake = 0.14;
          playLandingShockSound();

          shockwave.active = true;
          shockwave.x = lucNhamEntity.x;
          shockwave.y = lucNhamEntity.y + 12;
          shockwave.radius = 0;
          shockwave.maxR = 54;
          shockwave.alpha = 1;

          for (let i = 0; i < 14; i++) {
            const ang = (i / 14) * Math.PI * 2;
            dustParticles.push({
              x: shockwave.x,
              y: shockwave.y,
              vx: Math.cos(ang) * (28 + Math.random() * 36),
              vy: Math.sin(ang) * (12 + Math.random() * 16),
              size: 2 + Math.random() * 2.2,
              alpha: 0.8
            });
          }

          stepSubPhase = 'landed_wait';
          stepSubTimer = 0;
          targetCameraOffset = { x: -16, y: -92 };
        }
      } else if (stepSubPhase === 'landed_wait') {
        if (stepSubTimer >= 0.25) {
          lucNhamEntity.swordSheathed = true;
        }
        if (stepSubTimer >= 0.45 && !dialogueActive) {
          stepSubPhase = 'greeting_dialogue';
          startDialogue([
            {
              speaker: 'Dân làng',
              role: 'Quần Chúng',
              avatar: AVATARS.truong,
              text: 'Tiên nhân! Là tiên nhân thật sự! Trời ơi, ngự kiếm phi hành! Không ngờ đời này ta lại có thể tận mắt nhìn thấy tiên nhân!'
            },
            {
              speaker: 'Trưởng làng',
              role: 'Bậc Trưởng Bối · 60 tuổi',
              avatar: AVATARS.truong,
              text: 'Lão hủ là trưởng làng Du Lãm, cung nghênh tiên sư đại giá quang lâm! Đường sá xa xôi, chẳng hay tiên sư có cần nghỉ ngơi đôi chút?'
            },
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Không cần đa lễ. Ta là Lục Nham, đệ tử ngoại môn phụ trách tuyển chọn lần này. Phụng mệnh tông môn đến các thôn làng khảo nghiệm linh căn. Kẻ có tư chất thích hợp, ta sẽ dẫn về tông môn tu hành.'
            },
            {
              speaker: 'Trưởng làng',
              role: 'Bậc Trưởng Bối · 60 tuổi',
              avatar: AVATARS.truong,
              text: 'Đa tạ tiên sư đã ban cho đám trẻ trong làng một cơ duyên lớn lao! Lão hủ đã cho tập hợp tất cả thiếu niên đủ tuổi ngay ngắn phía dưới, xin tiên sư xem xét.'
            },
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Ừm. Khởi trận khảo nghiệm đi.',
              onFinish: () => {
                closeDialogue();
                // Chuyển sang Phân cảnh 3: Lục Nham phất tay triệu hồi Quan Trắc Thạch
                cinematicStep = 3;
                cinematicTimer = 0;
                stepSubPhase = 'summon_descend';
                stepSubTimer = 0;
                lucNhamEntity.casting = true;
                observationStone.visible = true;
                observationStone.alpha = 0;
                observationStone.scale = 0.35;
                observationStone.z = 140; // Hạ từ trên không trung xuống chính giữa hoa văn (Khu B)
                observationStone.beamAlpha = 1.0;
                observationStone.state = STONE_STATES.IDLE;
                observationStone.activeRoot = 'five_intro';
                targetCameraOffset = { x: 0, y: -74 };
                playStoneSummonSound();
              }
            }
          ]);
        }
      }
      return;
    }

    // ---------------------------------------------------------
    // PHÂN CẢNH 3: LỤC NHAM PHẤT TAY TRIỆU HỒI QUAN TRẮC THẠCH HẠ XUỐNG KHU B
    // ---------------------------------------------------------
    if (cinematicStep === 3) {
      if (stepSubPhase === 'summon_descend') {
        const pDesc = Math.min(1, stepSubTimer / 1.5);
        const ease = 1 - Math.pow(1 - pDesc, 3);
        observationStone.alpha = Math.min(1, pDesc * 1.4);
        observationStone.scale = 0.35 + 0.65 * ease;
        observationStone.z = Math.max(0, 140 * (1 - ease));
        observationStone.beamAlpha = Math.max(0, 1 - pDesc * 0.65);

        if (pDesc >= 1) {
          // Quan Trắc Thạch chạm đất chính giữa hoa văn hình tròn (680, 498)!
          observationStone.z = 0;
          observationStone.scale = 1;
          observationStone.alpha = 1;
          observationStone.beamAlpha = 0;
          observationStone.state = STONE_STATES.IDLE;
          observationStone.activeRoot = null;
          lucNhamEntity.casting = false;

          // Khi đá chạm đất, vòng tròn pháp trận phát sáng & toàn bộ đám đông hướng mặt về trung tâm
          playLandingShockSound();
          screenShake = 0.12;
          shockwave.active = true;
          shockwave.x = STONE_POS.x;
          shockwave.y = STONE_POS.y + 12;
          shockwave.radius = 4;
          shockwave.maxR = 76;
          shockwave.alpha = 1;
          orientCrowdToCenter(villagers);

          stepSubPhase = 'summon_settled';
          stepSubTimer = 0;
        }
      } else if (stepSubPhase === 'summon_settled') {
        if (stepSubTimer >= 0.35 && !dialogueActive) {
          stepSubPhase = 'summon_dialogue';
          startDialogue([
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Đây là Quan Trắc Thạch, pháp khí chuyên dùng để khảo nghiệm linh căn. Phàm nhân muốn tu tiên, trước hết phải có tư chất cảm ứng linh khí thiên địa.'
            },
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Khi được xướng danh, từng người một bước lên phía trước viên đá, đặt tay lên mặt đá. Chớ vận lực, chớ kinh hoảng, chỉ cần giữ tâm thần bình tĩnh.'
            },
            {
              speaker: 'Trưởng làng',
              role: 'Bậc Trưởng Bối · 60 tuổi',
              avatar: AVATARS.truong,
              text: 'Các thiếu niên nghe rõ chưa? Lão phu gọi tên ai thì người đó mới được rời hàng tiến lên! Tuyệt đối không được tự ý chen lấn!',
              onFinish: () => {
                closeDialogue();
                cinematicStep = 4; // Khảo nghiệm tuần tự từng thiếu niên NPC
                cinematicTimer = 0;
                currentCandidateIdx = 0;
                stepSubPhase = 'call';
                stepSubTimer = 0;
              }
            }
          ]);
        }
      }
      return;
    }

    // ---------------------------------------------------------
    // PHÂN CẢNH 4: CƠ CHẾ XƯỚNG DANH TUẦN TỰ TỪNG THIẾU NIÊN NPC
    // WAITING -> CALLED -> WALKING -> TESTING -> RESULT -> EXITED
    // ---------------------------------------------------------
    if (cinematicStep === 4) {
      if (currentCandidateIdx >= NPC_TEST_QUEUE.length) {
        cinematicStep = 5;
        cinematicTimer = 0;
        stepSubPhase = 'call';
        stepSubTimer = 0;
        return;
      }

      const candInfo = NPC_TEST_QUEUE[currentCandidateIdx];
      const reg = candidateRegistry[candInfo.id];
      const npc = villagers && villagers.list ? villagers.list.find((n) => n.id === candInfo.id) : null;

      if (!npc || !reg) {
        currentCandidateIdx++;
        stepSubPhase = 'call';
        stepSubTimer = 0;
        return;
      }

      if (stepSubPhase === 'call') {
        if (!dialogueActive) {
          reg.status = CANDIDATE_STATES.CALLED;
          npc.showCeremonyName = true;
          observationStone.state = STONE_STATES.IDLE;
          observationStone.glowColor = null;
          targetCameraOffset = { x: 0, y: -56 };

          stepSubPhase = 'calling_dialogue';
          startDialogue([
            {
              speaker: 'Trưởng làng',
              role: 'Bậc Trưởng Bối · 60 tuổi',
              avatar: AVATARS.truong,
              text: candInfo.callLine,
              onFinish: () => {
                closeDialogue();
                reg.status = CANDIDATE_STATES.WALKING;
                reg.waypoints = buildWaypointsToStone(npc.x, npc.y);
                stepSubPhase = 'walk_to_stone';
                stepSubTimer = 0;
              }
            }
          ]);
        }
      } else if (stepSubPhase === 'walk_to_stone') {
        const arrived = walkActorAlongWaypoints(npc, reg.waypoints, 88, dt, t);
        // Chống kẹt đường đi (anti-stuck fallback)
        if (arrived || stepSubTimer >= 2.2) {
          npc.x = TEST_STAND_POS.x;
          npc.y = TEST_STAND_POS.y;
          npc.walk = 0;
          npc.dir = 1; // Hướng về Quan Trắc Thạch
          npc.reachingStone = true; // Đưa tay chạm vào đá
          reg.waypoints = [];
          reg.status = CANDIDATE_STATES.TESTING;
          observationStone.state = STONE_STATES.TESTING;
          observationStone.stateTimer = 0;
          stepSubPhase = 'testing';
          stepSubTimer = 0;
        }
      } else if (stepSubPhase === 'testing') {
        npc.x = TEST_STAND_POS.x;
        npc.y = TEST_STAND_POS.y;
        npc.reachingStone = true;

        if (stepSubTimer >= 0.45 && observationStone.state === STONE_STATES.TESTING) {
          observationStone.state = STONE_STATES.NO_ROOT;
          observationStone.stateTimer = 0;
          observationStone.glowColor = 'rgba(165, 175, 172, 0.35)';
        }

        if (stepSubTimer >= 0.9 && !dialogueActive) {
          reg.status = CANDIDATE_STATES.RESULT;
          reg.testedCount++;
          stepSubPhase = 'result_dialogue';
          startDialogue([
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: candInfo.resultLine,
              onFinish: () => {
                closeDialogue();
                npc.reachingStone = false;
                observationStone.state = STONE_STATES.RESET;
                observationStone.stateTimer = 0;
                observationStone.glowColor = null;
                reg.waypoints = buildWaypointsToExit(npc.x, npc.y, reg.exitPos.x, reg.exitPos.y);
                stepSubPhase = 'walk_to_exit';
                stepSubTimer = 0;
              }
            }
          ]);
        }
      } else if (stepSubPhase === 'walk_to_exit') {
        const arrived = walkActorAlongWaypoints(npc, reg.waypoints, 95, dt, t);
        if (arrived || stepSubTimer >= 2.0) {
          npc.x = reg.exitPos.x;
          npc.y = reg.exitPos.y;
          npc.walk = 0;
          npc.dir = 1;
          npc.reachingStone = false;
          npc.showCeremonyName = false;
          reg.waypoints = [];
          reg.status = CANDIDATE_STATES.EXITED;
          observationStone.state = STONE_STATES.IDLE;
          currentCandidateIdx++;
          stepSubPhase = 'call';
          stepSubTimer = 0;
        }
      }
      return;
    }

    // ---------------------------------------------------------
    // PHÂN CẢNH 5: KHẢO NGHIỆM A HUY (TAM LINH CĂN)
    // ---------------------------------------------------------
    if (cinematicStep === 5) {
      const ahReg = candidateRegistry.aHuy;

      if (stepSubPhase === 'call') {
        if (!dialogueActive) {
          if (ahReg) ahReg.status = CANDIDATE_STATES.CALLED;
          if (typeof AHuy !== 'undefined') {
            AHuy.showCeremonyName = true;
            AHuy.reachingStone = false;
          }
          observationStone.state = STONE_STATES.IDLE;
          targetCameraOffset = { x: 10, y: -56 };

          stepSubPhase = 'calling_dialogue';
          startDialogue([
            {
              speaker: 'Trưởng làng',
              role: 'Bậc Trưởng Bối · 60 tuổi',
              avatar: AVATARS.truong,
              text: 'Người tiếp theo, A Huy! Tiến lên khảo nghiệm!'
            },
            {
              speaker: 'A Huy',
              role: 'Bạn cùng tuổi · 14 tuổi',
              avatar: AVATARS.aHuy,
              text: 'Hê hê, cuối cùng cũng tới lượt bổn thiếu gia! Tiểu Phàm, mở to mắt mà nhìn cho kỹ xem tiên nhân tương lai tỏa sáng thế nào nhé!',
              onFinish: () => {
                closeDialogue();
                if (ahReg) ahReg.status = CANDIDATE_STATES.WALKING;
                stepSubPhase = 'walk_to_stone';
                stepSubTimer = 0;
                targetCameraOffset = { x: 0, y: -62 };
              }
            }
          ]);
        }
      } else if (stepSubPhase === 'walk_to_stone') {
        let arrived = true;
        if (typeof AHuy !== 'undefined' && AHuy.walkToward) {
          arrived = AHuy.walkToward(TEST_STAND_POS.x, TEST_STAND_POS.y, 76, dt);
        }
        if (arrived || stepSubTimer >= 1.8) {
          if (typeof AHuy !== 'undefined') {
            AHuy.takeScenePosition(TEST_STAND_POS.x, TEST_STAND_POS.y, -1);
            AHuy.reachingStone = true;
          }
          if (ahReg) ahReg.status = CANDIDATE_STATES.TESTING;
          observationStone.state = STONE_STATES.TESTING;
          observationStone.stateTimer = 0;
          stepSubPhase = 'testing_swirl';
          stepSubTimer = 0;
        }
      } else if (stepSubPhase === 'testing_swirl') {
        if (stepSubTimer >= 0.45) {
          // Quan Trắc Thạch bùng phát Tam Linh Căn!
          if (ahReg) {
            ahReg.status = CANDIDATE_STATES.RESULT;
            ahReg.testedCount++;
          }
          screenShake = 0.22;
          observationStone.state = STONE_STATES.HAS_ROOT;
          observationStone.stateTimer = 0;
          observationStone.activeRoot = 'tam_linh_can';
          playTamLinhCanSound();

          spiritualPillars = [
            { color: '#ff4d4d', glow: 'rgba(255, 77, 77, 0.7)', x: STONE_POS.x - 22, height: 0, maxH: 82 },
            { color: '#e5b94c', glow: 'rgba(229, 185, 76, 0.7)', x: STONE_POS.x, height: 0, maxH: 90 },
            { color: '#4da6ff', glow: 'rgba(77, 166, 255, 0.7)', x: STONE_POS.x + 22, height: 0, maxH: 84 }
          ];

          showResultCard({
            name: 'A Huy',
            root: 'Hỏa — Thổ — Thủy',
            type: 'Tam Linh Căn',
            grade: 'Phẩm chất: Trung đẳng'
          });

          stepSubPhase = 'result_wait';
          stepSubTimer = 0;
        }
      } else if (stepSubPhase === 'result_wait') {
        if (stepSubTimer >= 0.9 && !dialogueActive) {
          stepSubPhase = 'result_dialogue';
          startDialogue([
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Ồ? Hỏa, Thổ, Thủy... Tam Linh Căn. Không tệ... Dẫu không phải tư chất thượng thừa, nhưng đã đủ điều kiện bước lên tiên lộ. Nếu chịu khó tu luyện, ngày sau chưa chắc không thể Trúc Cơ.'
            },
            {
              speaker: 'A Huy',
              role: 'Đệ Tử Nhập Môn · 14 tuổi',
              avatar: AVATARS.aHuy,
              text: 'Ha ha! Đa tạ tiên sư! Đệ tử biết ngay bổn thiếu gia có mệnh tiên nhân mà! Nhất định đệ tử sẽ chăm chỉ tu hành!'
            },
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Thu tay lại, sang đứng ở khu vực được chọn bên phải, chờ khảo nghiệm kết thúc.'
            },
            {
              speaker: 'Trưởng làng',
              role: 'Bậc Trưởng Bối · 60 tuổi',
              avatar: AVATARS.truong,
              text: 'Ha ha ha! Tốt! Tốt lắm! Làng Du Lãm chúng ta cuối cùng cũng xuất hiện một người có tiên duyên!'
            },
            {
              speaker: 'Dân làng',
              role: 'Quần Chúng',
              avatar: AVATARS.truong,
              text: 'A Huy thật có phúc! Cha mẹ nó phen này nở mày nở mặt rồi!',
              onFinish: () => {
                closeDialogue();
                hideResultCard();
                if (typeof AHuy !== 'undefined') AHuy.reachingStone = false;
                observationStone.activeRoot = null;
                observationStone.state = STONE_STATES.RESET;
                observationStone.stateTimer = 0;
                spiritualPillars = [];
                stepSubPhase = 'walk_to_exit';
                stepSubTimer = 0;
              }
            }
          ]);
        }
      } else if (stepSubPhase === 'walk_to_exit') {
        let arrived = true;
        if (typeof AHuy !== 'undefined' && AHuy.walkToward) {
          arrived = AHuy.walkToward(AHUY_PASSED_POS.x, AHUY_PASSED_POS.y, 84, dt);
        }
        if (arrived || stepSubTimer >= 1.8) {
          if (typeof AHuy !== 'undefined') {
            AHuy.takeScenePosition(AHUY_PASSED_POS.x, AHUY_PASSED_POS.y, -1);
            AHuy.reachingStone = false;
            AHuy.showCeremonyName = false;
          }
          if (ahReg) ahReg.status = CANDIDATE_STATES.EXITED;
          observationStone.state = STONE_STATES.IDLE;
          cinematicStep = 6; // Chuyển sang lượt Tiểu Phàm
          cinematicTimer = 0;
          stepSubPhase = 'call';
          stepSubTimer = 0;
        }
      }
      return;
    }

    // ---------------------------------------------------------
    // PHÂN CẢNH 6: KHẢO NGHIỆM TIỂU PHÀM (NGƯỜI CHƠI ĐIỀU KHIỂN & TƯƠNG TÁC)
    // ---------------------------------------------------------
    if (cinematicStep === 6) {
      const phamReg = candidateRegistry.tieuPham;

      if (stepSubPhase === 'call') {
        if (!dialogueActive) {
          if (phamReg) phamReg.status = CANDIDATE_STATES.CALLED;
          observationStone.state = STONE_STATES.IDLE;
          targetCameraOffset = { x: 0, y: -36 };

          stepSubPhase = 'calling_dialogue';
          startDialogue([
            {
              speaker: 'Trưởng làng',
              role: 'Bậc Trưởng Bối · 60 tuổi',
              avatar: AVATARS.truong,
              text: 'Tiểu Phàm, tiến lên!',
              choices: [
                {
                  id: 'auto_walk_stone',
                  label: 'Bước lên trước Quan Trắc Thạch (Tự động di chuyển)',
                  onSelect: () => {
                    closeDialogue();
                    if (phamReg) phamReg.status = CANDIDATE_STATES.WALKING;
                    phamAutoWalk = true;
                    stepSubPhase = 'player_walk';
                    stepSubTimer = 0;
                    targetCameraOffset = { x: 0, y: -48 };
                  }
                },
                {
                  id: 'manual_walk_stone',
                  label: 'Tự mình bước lên vị trí khảo nghiệm (Tự điều khiển)',
                  onSelect: () => {
                    closeDialogue();
                    if (phamReg) phamReg.status = CANDIDATE_STATES.WALKING;
                    phamAutoWalk = false;
                    stepSubPhase = 'player_walk';
                    stepSubTimer = 0;
                    targetCameraOffset = { x: 0, y: -48 };
                  }
                }
              ],
              onFinish: () => {
                closeDialogue();
                if (phamReg) phamReg.status = CANDIDATE_STATES.WALKING;
                phamAutoWalk = true;
                stepSubPhase = 'player_walk';
                stepSubTimer = 0;
                targetCameraOffset = { x: 0, y: -48 };
              }
            }
          ]);
        }
      } else if (stepSubPhase === 'player_walk') {
        // Giữ người chơi trong phạm vi trung tâm quảng trường để tránh đi lạc
        player.x = Math.max(560, Math.min(800, player.x));
        player.y = Math.max(480, Math.min(620, player.y));

        if (phamAutoWalk) {
          const dx = TEST_STAND_POS.x - player.x;
          const dy = TEST_STAND_POS.y - player.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 2) {
            const stepLen = Math.min(dist, 86 * dt);
            player.x += (dx / dist) * stepLen;
            player.y += (dy / dist) * stepLen;
            player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
            player.walk = (t || 1) * 11;
            if (typeof p !== 'undefined' && p) {
              p.x = player.x;
              p.y = player.y;
              p.dir = player.dir;
              p.walk = player.walk;
            }
          }
        }

        const distToStand = Math.hypot(player.x - TEST_STAND_POS.x, player.y - TEST_STAND_POS.y);
        if (distToStand <= 22 || (phamAutoWalk && stepSubTimer >= 1.5)) {
          player.x = TEST_STAND_POS.x;
          player.y = TEST_STAND_POS.y;
          player.dir = 'up';
          player.walk = 0;
          if (typeof p !== 'undefined' && p) {
            p.x = TEST_STAND_POS.x;
            p.y = TEST_STAND_POS.y;
            p.dir = 'up';
            p.walk = 0;
          }
          stepSubPhase = 'prompt_touch';
          stepSubTimer = 0;
          targetCameraOffset = { x: 0, y: -62 };
          startDialogue([
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Đặt tay lên Quan Trắc Thạch, giữ tâm thần bình tĩnh.',
              onFinish: () => {
                closeDialogue();
                stepSubPhase = 'await_touch';
                stepSubTimer = 0;
              }
            }
          ]);
        }
      } else if (stepSubPhase === 'await_touch') {
        // Chờ người chơi tương tác với Quan Trắc Thạch (Không kích hoạt kết quả trước khi người chơi tương tác!)
        player.x = TEST_STAND_POS.x;
        player.y = TEST_STAND_POS.y;
        player.dir = 'up';
        player.walk = 0;
      } else if (stepSubPhase === 'testing') {
        player.x = TEST_STAND_POS.x;
        player.y = TEST_STAND_POS.y;
        player.dir = 'up';
        player.reachingStone = true;
        if (typeof p !== 'undefined' && p) p.reachingStone = true;

        if (stepSubTimer >= 0.5 && observationStone.state === STONE_STATES.TESTING) {
          observationStone.state = STONE_STATES.HAS_ROOT;
          observationStone.stateTimer = 0;
          observationStone.activeRoot = 'ngu_tap_can';
          playNguTapCanSound();

          const colors = ['#f5d76e', '#5cd65c', '#4da6ff', '#ff4d4d', '#cca370'];
          for (let i = 0; i < 28; i++) {
            chaoticMotes.push({
              x: STONE_POS.x + (Math.random() - 0.5) * 24,
              y: STONE_POS.y - 12 + (Math.random() - 0.5) * 20,
              vx: (Math.random() - 0.5) * 35,
              vy: -15 - Math.random() * 25,
              color: colors[i % 5],
              size: 2.2 + Math.random() * 2,
              alpha: 0.95
            });
          }

          showResultCard({
            name: 'Tiểu Phàm',
            root: 'Kim — Mộc — Thủy — Hỏa — Thổ',
            type: 'Ngũ Hành Tạp Linh Căn',
            grade: 'Phẩm chất: Hạ đẳng'
          });

          questData.spiritualRoot = 'Ngũ Hành Tạp Linh Căn';
          saveState();
          if (phamReg) {
            phamReg.status = CANDIDATE_STATES.RESULT;
            phamReg.testedCount++;
          }
        }

        if (stepSubTimer >= 1.2 && !dialogueActive) {
          stepSubPhase = 'result_dialogue';
          startDialogue([
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Kim, Mộc, Thủy, Hỏa, Thổ... Ngũ Hành Tạp Linh Căn. Ngũ hành hỗn tạp, linh khí khó tụ. Với tư chất này, dù có dốc sức tu luyện, tiến cảnh cũng chậm chạp hơn người thường rất nhiều.'
            },
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Tiên đạo vô vọng...'
            },
            {
              speaker: 'Tiểu Phàm',
              role: 'Thiếu Niên · 14 tuổi',
              avatar: AVATARS.tieuPham,
              text: 'Tiên sư... chẳng lẽ có linh căn mà vẫn không thể tu tiên sao?'
            },
            {
              speaker: 'Lục Nham',
              role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
              avatar: AVATARS.lucNham,
              text: 'Có linh căn không đồng nghĩa với có tiên duyên. Con đường tu hành tranh đoạt với thiên địa. Kẻ tư chất xuất chúng còn có thể bỏ mạng giữa đường, huống chi là Ngũ Hành Tạp Linh Căn. Ta không nói ngươi tuyệt đối không thể tu luyện. Nhưng với điều kiện của tông môn, không thể thu nhận ngươi.'
            },
            {
              speaker: 'Tiểu Phàm',
              role: 'Thiếu Niên · 14 tuổi',
              avatar: AVATARS.tieuPham,
              text: '... Ta hiểu rồi.',
              onFinish: () => {
                closeDialogue();
                hideResultCard();
                player.reachingStone = false;
                if (typeof p !== 'undefined' && p) p.reachingStone = false;
                observationStone.activeRoot = null;
                observationStone.state = STONE_STATES.RESET;
                observationStone.stateTimer = 0;
                // Lùi Tiểu Phàm về vị trí hàng
                player.x = PHAM_SQUARE_POS.x;
                player.y = PHAM_SQUARE_POS.y;
                player.dir = 'up';
                if (typeof p !== 'undefined' && p) {
                  p.x = PHAM_SQUARE_POS.x;
                  p.y = PHAM_SQUARE_POS.y;
                  p.dir = 'up';
                }
                if (phamReg) phamReg.status = CANDIDATE_STATES.EXITED;
                cinematicStep = 7; // Trưởng làng an ủi
                cinematicTimer = 0;
                stepSubPhase = 'init';
                stepSubTimer = 0;
                targetCameraOffset = { x: 0, y: -42 };
              }
            }
          ]);
        }
      }
      return;
    }

    // ---------------------------------------------------------
    // PHÂN CẢNH 7: TRƯỞNG LÀNG AN ỦI
    // ---------------------------------------------------------
    if (cinematicStep === 7) {
      if (!dialogueActive && stepSubTimer >= 0.3) {
        stepSubPhase = 'dialogue';
        startDialogue([
          {
            speaker: 'Trưởng làng',
            role: 'Bậc Trưởng Bối · 60 tuổi',
            avatar: AVATARS.truong,
            text: 'Nhóc con... Haizz, tạo hóa trêu ngươi. Lão phu vốn còn mong ngươi có thể cùng A Huy bước lên tiên lộ.'
          },
          {
            speaker: 'Trưởng làng',
            role: 'Bậc Trưởng Bối · 60 tuổi',
            avatar: AVATARS.truong,
            text: 'Nhưng ngươi chớ quá đau lòng. Tu tiên hay không cũng chẳng quyết định giá trị một đời người. Dù không được tiên môn thu nhận, ngươi vẫn là đứa trẻ của làng Du Lãm chúng ta.'
          },
          {
            speaker: 'Trưởng làng',
            role: 'Bậc Trưởng Bối · 60 tuổi',
            avatar: AVATARS.truong,
            text: 'Lão phu già rồi, chẳng hiểu hết chuyện tiên đạo. Nhưng lão phu tin rằng, con đường của một người không nên chỉ được định đoạt bởi một khối đá.',
            onFinish: () => {
              closeDialogue();
              cinematicStep = 8; // A Huy khiêu khích
              cinematicTimer = 0;
              stepSubPhase = 'init';
              stepSubTimer = 0;
            }
          }
        ]);
      }
      return;
    }

    // ---------------------------------------------------------
    // PHÂN CẢNH 8: A HUY KHIÊU KHÍCH & 3 LỰA CHỌN PHẢN ỨNG
    // ---------------------------------------------------------
    if (cinematicStep === 8) {
      if (!dialogueActive && stepSubTimer >= 0.3 && stepSubPhase === 'init') {
        stepSubPhase = 'dialogue';
        if (typeof AHuy !== 'undefined') {
          AHuy.takeScenePosition(player.x + 36, player.y - 6, -1);
          AHuy.showCeremonyName = true;
        }

        startDialogue([
          {
            speaker: 'A Huy',
            role: 'Đệ Tử Tiên Môn · 14 tuổi',
            avatar: AVATARS.aHuy,
            text: 'Ha ha ha! Tiểu Phàm, ngươi nghe rõ chưa? Ngũ Hành Tạp Linh Căn! Ta còn tưởng ngươi có bản lĩnh gì ghê gớm lắm! Ngày trước ngươi còn dám cãi lời ta. Bây giờ thì sao? Ta sắp trở thành đệ tử tiên môn, còn ngươi vẫn chỉ là một tên phàm nhân trong làng!',
            choices: [
              {
                id: 'defiant',
                label: '“Hừ, hôm nay ngươi hơn ta, chưa chắc cả đời đều hơn ta!”',
                onSelect: () => {
                  questData.rivalryReaction = 'defiant';
                  saveState();
                  startDialogue([
                    {
                      speaker: 'Tiểu Phàm',
                      role: 'Thiếu Niên · 14 tuổi',
                      avatar: AVATARS.tieuPham,
                      text: 'Hừ, hôm nay ngươi hơn ta, chưa chắc cả đời đều hơn ta!'
                    },
                    {
                      speaker: 'A Huy',
                      role: 'Đệ Tử Tiên Môn · 14 tuổi',
                      avatar: AVATARS.aHuy,
                      text: 'Ha ha! Khẩu khí lớn thật! Vậy ta sẽ chờ xem một tên Tạp Linh Căn như ngươi có thể làm nên trò trống gì!'
                    },
                    ...SCRIPT_STOP_BY_LUC
                  ]);
                }
              },
              {
                id: 'lucky',
                label: '“Có gì đáng khoe khoang? Chẳng qua ngươi may mắn hơn ta mà thôi.”',
                onSelect: () => {
                  questData.rivalryReaction = 'lucky';
                  saveState();
                  startDialogue([
                    {
                      speaker: 'Tiểu Phàm',
                      role: 'Thiếu Niên · 14 tuổi',
                      avatar: AVATARS.tieuPham,
                      text: 'Có gì đáng khoe khoang? Chẳng qua ngươi may mắn hơn ta mà thôi.'
                    },
                    {
                      speaker: 'A Huy',
                      role: 'Đệ Tử Tiên Môn · 14 tuổi',
                      avatar: AVATARS.aHuy,
                      text: 'May mắn? Hừ! Trong tiên đạo, tư chất chính là vốn liếng. Ngươi không có, thì đừng trách trời bất công!'
                    },
                    ...SCRIPT_STOP_BY_LUC
                  ]);
                }
              },
              {
                id: 'silent',
                label: '“...” (Im lặng, không đáp)',
                onSelect: () => {
                  questData.rivalryReaction = 'silent';
                  saveState();
                  startDialogue([
                    {
                      speaker: 'Tiểu Phàm',
                      role: 'Thiếu Niên · 14 tuổi',
                      avatar: AVATARS.tieuPham,
                      text: '...'
                    },
                    {
                      speaker: 'A Huy',
                      role: 'Đệ Tử Tiên Môn · 14 tuổi',
                      avatar: AVATARS.aHuy,
                      text: 'Sao thế? Không còn lời nào để nói à? Xem ra ngươi cũng biết thân biết phận rồi!'
                    },
                    ...SCRIPT_STOP_BY_LUC
                  ]);
                }
              }
            ]
          }
        ]);
      }
      return;
    }

    // ---------------------------------------------------------
    // PHÂN CẢNH 10: RỜI LÀNG (PHI KIẾM CẤT CÁNH BAY ĐI)
    // ---------------------------------------------------------
    if (cinematicStep === 10) {
      const progress = Math.min(1, cinematicTimer / 3.2);
      const ease = Math.pow(progress, 2.6);

      lucNhamEntity.mode = 'fly_away';
      lucNhamEntity.swordSheathed = false;
      lucNhamEntity.swordScale = 1.6;
      targetCameraOffset = { x: 0, y: -80 };

      // Phi kiếm cất cánh chở Lục Nham và A Huy bay về góc chân trời
      lucNhamEntity.x = LUC_NHAM_STAND.x + ease * 520;
      lucNhamEntity.y = LUC_NHAM_STAND.y - ease * 440;
      lucNhamEntity.z = ease * 340;

      if (typeof AHuy !== 'undefined') {
        AHuy.takeScenePosition(lucNhamEntity.x - 18, lucNhamEntity.y + 4);
      }

      if (progress >= 1) {
        cinematicStep = 11;
        targetCameraOffset = { x: 0, y: 0 };
        cameraOffset = { x: 0, y: 0 };
        completeQuest(player, villagers);
      }
    }
  }

  // PHÂN CẢNH 9: LỤC NHAM NGĂN LẠI VÀ CHUYỂN TIẾP RỜI LÀNG
  const SCRIPT_STOP_BY_LUC = [
    {
      speaker: 'Lục Nham',
      role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
      avatar: AVATARS.lucNham,
      text: 'Đủ rồi. Chưa bước chân vào tiên môn đã sinh lòng kiêu ngạo, ngươi tưởng có Tam Linh Căn là có thể tung hoành thiên hạ sao? Tu tiên không chỉ xét tư chất, mà còn phải xét tâm tính. Nếu giữ thái độ này, sớm muộn cũng tự chuốc lấy tai họa.'
    },
    {
      speaker: 'A Huy',
      role: 'Đệ Tử Tiên Môn · 14 tuổi',
      avatar: AVATARS.aHuy,
      text: 'Đệ tử biết sai! Xin tiên sư trách phạt!'
    },
    {
      speaker: 'Lục Nham',
      role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
      avatar: AVATARS.lucNham,
      text: 'Biết sai thì sửa. Lần sau chớ tái phạm.'
    },
    {
      speaker: 'Lục Nham',
      role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
      avatar: AVATARS.lucNham,
      text: 'Tiểu tử, ngươi cũng không cần quá để tâm. Đại đạo vô tình, nhưng thiên địa rộng lớn, không ai có thể nhìn thấu hết mọi cơ duyên. Chỉ là hôm nay, ta không thể đưa ngươi đi.'
    },
    {
      speaker: 'Lục Nham',
      role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
      avatar: AVATARS.lucNham,
      text: 'Khảo nghiệm đến đây kết thúc. Lần tuyển chọn này, chỉ có A Huy đạt yêu cầu nhập môn. A Huy, tiến lên.'
    },
    {
      speaker: 'A Huy',
      role: 'Đệ Tử Tiên Môn · 14 tuổi',
      avatar: AVATARS.aHuy,
      text: 'Có đệ tử!'
    },
    {
      speaker: 'Lục Nham',
      role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
      avatar: AVATARS.lucNham,
      text: 'Ngươi hãy theo ta trở về tông môn. Từ hôm nay, ngươi cần đoạn tuyệt sự lười biếng của phàm tục, chuyên tâm tu hành.'
    },
    {
      speaker: 'Trưởng làng',
      role: 'Bậc Trưởng Bối · 60 tuổi',
      avatar: AVATARS.truong,
      text: 'Tiên sư! Đa tạ ngài đã ban cho làng chúng ta cơ duyên này! Còn A Huy, sau này dù tu hành đến cảnh giới nào, cũng chớ quên nơi mình sinh ra.'
    },
    {
      speaker: 'A Huy',
      role: 'Đệ Tử Tiên Môn · 14 tuổi',
      avatar: AVATARS.aHuy,
      text: 'Trưởng làng cứ yên tâm! Ngày sau ta tu luyện thành công, nhất định sẽ trở về!'
    },
    {
      speaker: 'A Huy',
      role: 'Đệ Tử Tiên Môn · 14 tuổi',
      avatar: AVATARS.aHuy,
      text: 'Tiểu Phàm, bảo trọng nhé. Lần sau gặp lại, chỉ e ngươi phải gọi ta một tiếng tiên sư rồi! Ha ha!'
    },
    {
      speaker: 'Lục Nham',
      role: 'Tiên Môn Đệ Tử · Trúc Cơ Sơ Kỳ',
      avatar: AVATARS.lucNham,
      text: 'Lên đây. Đứng vững, chớ vọng động.',
      onFinish: () => {
        closeDialogue();
        observationStone.visible = false;
        playSwordCrySound();
        cinematicStep = 10; // Bắt đầu cất cánh bay đi
        cinematicTimer = 0;
        stepSubPhase = 'fly_away';
        stepSubTimer = 0;
      }
    }
  ];

  function completeQuest(player, villagers) {
    questData.state = STATES.COMPLETED;
    questData.completed = true;
    saveState();

    if (typeof AHuy !== 'undefined') {
      AHuy.hidden = true;
      AHuy.reachingStone = false;
      AHuy.showCeremonyName = false;
    }
    lucNhamEntity.visible = false;
    if (player) player.reachingStone = false;
    if (typeof p !== 'undefined' && p) p.reachingStone = false;

    // Giải tán dân làng ngay khi tiên nhân rời đi để không còn ai đứng bất động
    const vList = villagers || cachedVillagers || (typeof Villagers !== 'undefined' ? Villagers : null);
    if (vList && typeof vList.disbandCeremony === 'function') {
      vList.disbandCeremony();
    } else if (vList && vList.list) {
      vList.list.forEach((n) => {
        n.state = '';
        n.pause = 0;
        n.reachingStone = false;
        n.showCeremonyName = false;
        n.route = [];
        n.arrived = false;
        n.spokenLine = '';
        if (vList.plan) vList.plan(n);
      });
    }

    // Trưởng làng tiễn biệt
    startDialogue([
      {
        speaker: 'Trưởng làng',
        role: 'Bậc Trưởng Bối · 60 tuổi',
        avatar: AVATARS.truong,
        text: 'Haizz... đi rồi. Nhóc con, về thôi. Đường đời còn dài. Hôm nay không có tiên duyên, chưa chắc ngày mai đã không có cơ hội khác. Chỉ cần ngươi còn sống, còn bước tiếp, thì mọi chuyện vẫn chưa phải kết thúc.',
        onFinish: () => {
          closeDialogue();
          showToast(
            'Nhiệm vụ hoàn thành: Tiên Duyên Khởi Đầu!\nTiểu Phàm xác định tư chất: Ngũ Hành Tạp Linh Căn.\nA Huy đã theo Lục Nham bước lên tiên lộ.'
          );
          // Giải tán dân làng trở lại sinh hoạt bình thường
          const vList = villagers || cachedVillagers || (typeof Villagers !== 'undefined' ? Villagers : null);
          if (vList && typeof vList.disbandCeremony === 'function') {
            vList.disbandCeremony();
          } else if (vList && vList.list) {
            vList.list.forEach((n) => {
              n.state = '';
              n.pause = 0;
              n.reachingStone = false;
              n.showCeremonyName = false;
              n.route = [];
              n.arrived = false;
              n.spokenLine = '';
              if (vList.plan) vList.plan(n);
            });
          }
          if (typeof GameSave !== 'undefined' && typeof GameSave.save === 'function') {
            GameSave.save(true, player);
          }
        }
      }
    ]);
  }

  // -------------------------------------------------------------
  // DRAWING HỆ THỐNG VẬT THỂ, QUAN TRẮC THẠCH 5 TRẠNG THÁI & CINEMATIC
  // -------------------------------------------------------------
  let groundDrawnThisFrame = false;

  // Vẽ tầng mặt đất (Pháp trận Liên Hoa xoay tròn, bóng Quan Trắc Thạch, sóng xung kích) TRƯỚC khi vẽ nhân vật để không đè lên người khảo nghiệm
  function drawGround(ctx, t) {
    if (!ctx) return;
    groundDrawnThisFrame = true;

    // 1. Vẽ Pháp Trận Bát Quái - Liên Hoa xoay tròn trên mặt sân ngọc bích & bóng Quan Trắc Thạch
    if (observationStone.visible && observationStone.alpha > 0) {
      const lx = SQUARE_CENTER.x;
      const ly = SQUARE_CENTER.y;
      const sz = observationStone.z || 0;
      const scale = observationStone.scale || 1;
      const stState = observationStone.state || STONE_STATES.IDLE;
      const floatAmp =
        stState === STONE_STATES.NO_ROOT
          ? 1.4
          : stState === STONE_STATES.TESTING || stState === STONE_STATES.HAS_ROOT
            ? 4.0
            : 2.8;
      const floatSpeed = stState === STONE_STATES.TESTING || stState === STONE_STATES.HAS_ROOT ? 3.6 : 2.4;
      const floatBob = Math.sin(t * floatSpeed) * floatAmp + (stState === STONE_STATES.NO_ROOT ? 3 : 0);

      if (sz <= 65) {
        ctx.save();
        ctx.translate(lx, ly);
        // Khớp chính xác tỷ lệ phối cảnh elip (0.62) của đài hoa sen ngọc bích trong square.js
        ctx.scale(1, 0.62);

        const groundFactor = Math.max(0, Math.min(1, (1 - sz / 75) * observationStone.alpha));
        const rotSpeed =
          stState === STONE_STATES.TESTING
            ? 1.85
            : stState === STONE_STATES.HAS_ROOT
              ? 2.65
              : stState === STONE_STATES.NO_ROOT
                ? 0.22
                : 0.62;

        let outerCol = 'rgba(110, 240, 225, 0.58)';
        let innerCol = 'rgba(250, 230, 145, 0.52)';
        let coreCol = 'rgba(165, 255, 240, 0.36)';
        if (stState === STONE_STATES.TESTING) {
          outerCol = 'rgba(255, 230, 125, 0.88)';
          innerCol = 'rgba(125, 250, 245, 0.85)';
          coreCol = 'rgba(255, 245, 190, 0.55)';
        } else if (stState === STONE_STATES.NO_ROOT) {
          const fade = Math.max(0.12, 0.52 - observationStone.stateTimer * 0.38);
          outerCol = `rgba(148, 163, 178, ${fade.toFixed(2)})`;
          innerCol = `rgba(120, 132, 145, ${(fade * 0.8).toFixed(2)})`;
          coreCol = `rgba(100, 115, 128, ${(fade * 0.45).toFixed(2)})`;
        } else if (stState === STONE_STATES.HAS_ROOT) {
          outerCol =
            observationStone.activeRoot === 'tam_linh_can'
              ? 'rgba(255, 218, 90, 0.94)'
              : 'rgba(125, 255, 190, 0.9)';
          innerCol = 'rgba(255, 248, 195, 0.92)';
          coreCol =
            observationStone.activeRoot === 'tam_linh_can'
              ? 'rgba(255, 195, 75, 0.62)'
              : 'rgba(140, 255, 215, 0.56)';
        } else if (stState === STONE_STATES.RESET) {
          outerCol = 'rgba(110, 215, 200, 0.42)';
          innerCol = 'rgba(220, 208, 140, 0.36)';
          coreCol = 'rgba(110, 215, 200, 0.22)';
        }

        ctx.globalAlpha = groundFactor;

        // Quầng linh khí lan tỏa trên mặt đá hoa sen
        const groundGlow = ctx.createRadialGradient(0, 0, 4, 0, 0, 56 * scale);
        groundGlow.addColorStop(0, coreCol);
        groundGlow.addColorStop(0.55, outerCol);
        groundGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = groundGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 56 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Vòng pháp trận ngoại vi xoay thuận chiều kim đồng hồ (gồm 8 cung phù văn + 8 mắt trận Bát Quái)
        ctx.save();
        ctx.rotate(t * rotSpeed);
        const outerR = 46 * scale;
        ctx.strokeStyle = outerCol;
        ctx.lineWidth = stState === STONE_STATES.HAS_ROOT || stState === STONE_STATES.TESTING ? 2.2 : 1.6;
        for (let seg = 0; seg < 8; seg++) {
          const a0 = (seg * Math.PI) / 4 + 0.07;
          const a1 = ((seg + 1) * Math.PI) / 4 - 0.07;
          ctx.beginPath();
          ctx.arc(0, 0, outerR, a0, a1);
          ctx.stroke();
        }
        for (let k = 0; k < 8; k++) {
          const ang = (k * Math.PI) / 4;
          const nx = Math.cos(ang) * outerR;
          const ny = Math.sin(ang) * outerR;
          ctx.save();
          ctx.translate(nx, ny);
          ctx.rotate(ang + Math.PI / 4);
          ctx.fillStyle = k % 2 === 0 ? innerCol : outerCol;
          ctx.fillRect(-2.5, -2.5, 5, 5);
          ctx.restore();
        }
        ctx.restore();

        // Vòng pháp trận trung tâm xoay ngược chiều kim đồng hồ
        ctx.save();
        ctx.rotate(-t * rotSpeed * 1.35);
        const midR = 32 * scale;
        ctx.strokeStyle = innerCol;
        ctx.lineWidth = 1.5;
        for (let seg = 0; seg < 12; seg++) {
          const a0 = (seg * Math.PI) / 6 + 0.08;
          const a1 = ((seg + 1) * Math.PI) / 6 - 0.08;
          ctx.beginPath();
          ctx.arc(0, 0, midR, a0, a1);
          ctx.stroke();
        }
        for (let k = 0; k < 4; k++) {
          const ang = (k * Math.PI) / 2;
          const nx = Math.cos(ang) * midR;
          const ny = Math.sin(ang) * midR;
          ctx.fillStyle = '#fff9d2';
          ctx.beginPath();
          ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Vòng tiểu chu thiên trong cùng xoay thuận tốc độ cao
        ctx.save();
        ctx.rotate(t * rotSpeed * 1.9);
        const innerR = 19 * scale;
        ctx.strokeStyle = outerCol;
        ctx.lineWidth = 1.2;
        for (let seg = 0; seg < 4; seg++) {
          const a0 = (seg * Math.PI) / 2 + 0.16;
          const a1 = ((seg + 1) * Math.PI) / 2 - 0.16;
          ctx.beginPath();
          ctx.arc(0, 0, innerR, a0, a1);
          ctx.stroke();
        }
        ctx.restore();

        ctx.restore();
      }

      // Bóng viên đá lơ lửng ngay tại tâm đài hoa sen (y = 510)
      ctx.save();
      ctx.translate(lx, ly);
      ctx.scale(1, 0.52);
      const shadowScale = Math.max(0.38, 1 - sz / 240 - floatBob * 0.014);
      ctx.fillStyle = stState === STONE_STATES.HAS_ROOT ? 'rgba(16, 38, 30, 0.34)' : 'rgba(10, 22, 26, 0.44)';
      ctx.beginPath();
      ctx.arc(0, 0, 14 * scale * shadowScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Vẽ vòng sóng xung kích khi tiếp đất hoặc khi Quan Trắc Thạch giáng lâm
    if (shockwave.active && shockwave.alpha > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(shockwave.x, shockwave.y, shockwave.radius, shockwave.radius * 0.58, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(125, 249, 255, ${shockwave.alpha * 0.85})`;
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(shockwave.x, shockwave.y, shockwave.radius * 0.65, shockwave.radius * 0.38, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(229, 255, 240, ${shockwave.alpha * 0.65})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Vẽ bụi đất nhẹ trên mặt sân
    if (dustParticles.length) {
      ctx.save();
      dustParticles.forEach((dp) => {
        ctx.fillStyle = `rgba(212, 190, 145, ${dp.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(dp.x, dp.y, dp.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 4. Vẽ vòng chỉ dẫn vị trí đứng khảo nghiệm dưới chân khi đến lượt Tiểu Phàm bước lên
    if (cinematicStep === 6 && (stepSubPhase === 'player_walk' || stepSubPhase === 'await_touch')) {
      ctx.save();
      const pulse = 0.65 + 0.35 * Math.sin(t * 5);
      ctx.translate(TEST_STAND_POS.x, TEST_STAND_POS.y);
      ctx.scale(1, 0.55);
      const r = 17 + Math.sin(t * 4) * 1.8;
      ctx.strokeStyle = `rgba(255, 224, 102, ${pulse})`;
      ctx.lineWidth = 2.0;
      for (let seg = 0; seg < 8; seg++) {
        ctx.beginPath();
        ctx.arc(0, 0, r, (seg * Math.PI) / 4 + 0.08, ((seg + 1) * Math.PI) / 4 - 0.08);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Bóng phi kiếm của Lục Nham trên mặt đất
    if (lucNhamEntity.visible && lucNhamEntity.z > 0) {
      ctx.save();
      ctx.translate(lucNhamEntity.x, lucNhamEntity.y + 12);
      ctx.scale(1, 0.4);
      ctx.beginPath();
      const shadowAlpha = Math.max(0.12, 0.5 - lucNhamEntity.z / 600);
      ctx.fillStyle = `rgba(15, 30, 22, ${shadowAlpha})`;
      ctx.arc(0, 0, 24 * (1 - lucNhamEntity.z / 800), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawWorld(ctx, t) {
    // Nếu drawGround chưa được gọi riêng ở tầng nền (ví dụ trong unit test), tự động vẽ để bảo toàn đầy đủ hiệu ứng
    if (!groundDrawnThisFrame) {
      drawGround(ctx, t);
    }
    groundDrawnThisFrame = false;

    // 1. Vẽ dấu chấm than (!) trên đầu Trưởng làng khi có nhiệm vụ
    if (cachedChief && !cachedChief.hidden) {
      const showExclamation =
        questData.state === STATES.CHIEF_APPROACHING ||
        questData.state === STATES.CONSIDERING ||
        questData.state === STATES.DECLINED ||
        questData.state === STATES.SELECTION_READY;

      if (showExclamation) {
        ctx.save();
        const x = Math.round(cachedChief.x);
        const bounce = Math.sin(t * 4.5) * 3.5;
        const y = Math.round(cachedChief.y - 88 + bounce);

        const glow = ctx.createRadialGradient(x, y, 2, x, y, 16);
        glow.addColorStop(0, 'rgba(255, 225, 90, 0.7)');
        glow.addColorStop(0.6, 'rgba(218, 165, 32, 0.35)');
        glow.addColorStop(1, 'rgba(218, 165, 32, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 10.5, 0, Math.PI * 2);
        ctx.fillStyle = '#b8860b';
        ctx.fill();
        ctx.strokeStyle = '#fff2a8';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 8.5, 0, Math.PI * 2);
        ctx.fillStyle = '#142a1f';
        ctx.fill();

        ctx.font = 'bold 12px "Noto Serif", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffe266';
        ctx.fillText('!', x, y);
        ctx.restore();
      }

      // 1b. Bong bóng lời gọi khi Trưởng làng chủ động tìm Tiểu Phàm
      if (
        questData.state === STATES.CHIEF_APPROACHING &&
        questData.approachDelay <= 0 &&
        !dialogueActive &&
        cachedChief.spokenLine
      ) {
        ctx.save();
        ctx.font = 'italic 10.5px "Noto Serif", Georgia, serif';
        const text = cachedChief.spokenLine;
        const bw = ctx.measureText(text).width + 16;
        const cx = Math.round(cachedChief.x);
        const cy = Math.round(cachedChief.y - 105);
        ctx.fillStyle = '#13281fe8';
        ctx.fillRect(cx - bw / 2, cy - 8, bw, 18);
        ctx.strokeStyle = '#d6c384cc';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - bw / 2, cy - 8, bw, 18);
        ctx.fillStyle = '#f7e9bc';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy + 1);
        ctx.restore();
      }
    }

    // 2. Vẽ Quan Trắc Thạch lơ lửng & Vòng Xoáy Linh Khí 3D (14 Sprite WebP + Đa tầng FX Pixel 2D)
    if (observationStone.visible && observationStone.alpha > 0) {
      drawObservationStoneAndFX(ctx, t);
    }

    // 3. Vẽ 3 Cột Sáng Tam Linh Căn của A Huy (nâng cấp hiệu ứng phù văn & tinh quang pixel)
    if (spiritualPillars.length) {
      ctx.save();
      spiritualPillars.forEach((col, idx) => {
        const py = STONE_POS.y - 22;
        const pulseW = 15 + Math.sin(t * 9 + idx * 1.7) * 2.5;
        const grad = ctx.createLinearGradient(col.x, py, col.x, py - col.height);
        grad.addColorStop(0, col.glow);
        grad.addColorStop(0.45, col.color);
        grad.addColorStop(0.85, '#fffbe6');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(
          Math.round(col.x - pulseW / 2),
          Math.round(py - col.height),
          Math.round(pulseW),
          Math.round(col.height)
        );

        // Lõi sáng trắng tinh khiết ở tâm cột linh quang
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.fillRect(Math.round(col.x - 2), Math.round(py - col.height * 0.92), 4, Math.round(col.height * 0.88));

        // Vòng linh hoàn dưới chân mỗi cột sáng
        ctx.beginPath();
        ctx.ellipse(col.x, py, 10 + Math.sin(t * 7 + idx) * 2, 4.2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = col.color;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Hạt tinh quang 4 cánh bay lên dọc cột sáng
        for (let k = 0; k < 4; k++) {
          const sparkY = py - ((t * 52 + k * 24 + idx * 11) % Math.max(1, col.height));
          const sparkX = col.x + Math.sin(t * 8 + k * 1.9 + idx) * 6;
          ctx.fillStyle = k % 2 === 0 ? '#ffffff' : col.color;
          ctx.fillRect(Math.round(sparkX) - 1, Math.round(sparkY) - 3, 2, 6);
          ctx.fillRect(Math.round(sparkX) - 3, Math.round(sparkY) - 1, 6, 2);
        }
      });
      ctx.restore();
    }

    // 4. Vẽ các đốm sáng & tia linh khí Ngũ Hành Tạp Linh Căn chập chờn của Tiểu Phàm
    if (chaoticMotes.length) {
      ctx.save();
      chaoticMotes.forEach((m, idx) => {
        ctx.fillStyle = m.color;
        ctx.globalAlpha = Math.max(0, m.alpha);
        const mx = Math.round(m.x);
        const my = Math.round(m.y - 18);
        const sz = Math.max(1.5, Math.round(m.size));
        // Vẽ hạt linh quang dạng chữ thập pixel sắc nét
        ctx.fillRect(mx - sz, my - 1, sz * 2, 2);
        ctx.fillRect(mx - 1, my - sz, 2, sz * 2);
        if (idx % 2 === 0) {
          ctx.beginPath();
          ctx.arc(m.x, m.y - 18, m.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

    // 5. Vẽ Vệt Kiếm Quang (Blade Ribbon Trail)
    if (swordTrail.length > 1) {
      ctx.save();
      for (let i = 0; i < swordTrail.length - 1; i++) {
        const p1 = swordTrail[i];
        const p2 = swordTrail[i + 1];
        const w = (1 - i / swordTrail.length) * 8;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(125, 249, 255, ${p1.alpha * (1 - i / swordTrail.length)})`;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Vẽ Lục Nham & Phi Kiếm Bạc Xanh
    if (lucNhamEntity.visible) {
      drawLucNham(ctx, t);
    }
  }

  // -------------------------------------------------------------
  // BỘ TÀI NGUYÊN 14 SPRITE WEBP QUAN TRẮC THẠCH & BỘ LỌC TÁCH NỀN TỰ ĐỘNG
  // -------------------------------------------------------------
  const STONE_SPRITE_DEFS = {
    summon: { src: 'quan-trac-thach/01_quan_trac_thach_trieu_hoi.webp', mode: 'summon' },
    float0: { src: 'quan-trac-thach/02_lo_lung_frame_01.webp', mode: 'float' },
    float1: { src: 'quan-trac-thach/03_lo_lung_frame_02.webp', mode: 'float' },
    float2: { src: 'quan-trac-thach/04_lo_lung_frame_03.webp', mode: 'float' },
    float3: { src: 'quan-trac-thach/05_lo_lung_frame_04.webp', mode: 'float' },
    qi0: { src: 'quan-trac-thach/06_linh_khi_frame_01.webp', mode: 'qi' },
    qi1: { src: 'quan-trac-thach/07_linh_khi_frame_02.webp', mode: 'qi' },
    qi2: { src: 'quan-trac-thach/08_linh_khi_frame_03.webp', mode: 'qi' },
    qi3: { src: 'quan-trac-thach/09_linh_khi_frame_04.webp', mode: 'qi' },
    stateIdle: { src: 'quan-trac-thach/10_trang_thai_cho.webp', mode: 'card' },
    stateTesting: { src: 'quan-trac-thach/11_dang_khao_nghiem.webp', mode: 'card' },
    stateNoRoot: { src: 'quan-trac-thach/12_khong_co_linh_can.webp', mode: 'card_dim' },
    stateHasRoot: { src: 'quan-trac-thach/13_co_linh_can.webp', mode: 'card' },
    stateExcellent: { src: 'quan-trac-thach/14_linh_can_xuat_sac.webp', mode: 'card' }
  };

  const stoneSprites = {
    loaded: false,
    images: {},
    cleaned: {}
  };

  function cleanStoneSpriteToCanvas(img, _def) {
    if (!img || !img.width || !img.height || typeof document === 'undefined' || !document.createElement) {
      return img;
    }
    try {
      const w = img.width;
      const h = img.height;
      const cvs = document.createElement('canvas');
      if (!cvs || typeof cvs.getContext !== 'function') return img;
      cvs.width = w;
      cvs.height = h;
      const cctx = cvs.getContext('2d');
      if (!cctx || typeof cctx.getImageData !== 'function') return img;
      cctx.drawImage(img, 0, 0);
      return cvs;
    } catch (_e) {
      return img;
    }
  }

  function ensureStoneSpritesLoaded() {
    if (stoneSprites.loaded || typeof Image === 'undefined') return;
    stoneSprites.loaded = true;
    Object.keys(STONE_SPRITE_DEFS).forEach((key) => {
      const def = STONE_SPRITE_DEFS[key];
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        stoneSprites.cleaned[key] = cleanStoneSpriteToCanvas(img, def);
      };
      img.src = def.src;
      stoneSprites.images[key] = img;
    });
  }

  function getStoneDrawable(key) {
    ensureStoneSpritesLoaded();
    if (stoneSprites.cleaned[key]) return stoneSprites.cleaned[key];
    const raw = stoneSprites.images[key];
    if (raw && raw.complete && raw.naturalWidth > 0) {
      stoneSprites.cleaned[key] = cleanStoneSpriteToCanvas(raw, STONE_SPRITE_DEFS[key] || {});
      return stoneSprites.cleaned[key];
    }
    return null;
  }

  function drawCenteredSprite(ctx, drawable, cx, cy, targetW, targetH, alpha = 1) {
    if (!drawable || alpha <= 0) return false;
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, alpha));
    if ('imageSmoothingEnabled' in ctx) {
      ctx.imageSmoothingEnabled = false;
    }
    ctx.drawImage(
      drawable,
      Math.round(cx - targetW / 2),
      Math.round(cy - targetH / 2),
      Math.round(targetW),
      Math.round(targetH)
    );
    ctx.restore();
    return true;
  }

  // Vẽ nửa sau hoặc nửa trước của dải lụa linh khí xoay tròn 360 độ quanh thân Quan Trắc Thạch
  function drawOrbitalQiHalf(ctx, cx, cy, scale, t, stState, activeRoot, alpha, isFront) {
    if (stState === STONE_STATES.NO_ROOT || alpha <= 0) return;
    ctx.save();
    const isActive = stState === STONE_STATES.TESTING || stState === STONE_STATES.HAS_ROOT;
    const speed = stState === STONE_STATES.HAS_ROOT ? 3.8 : stState === STONE_STATES.TESTING ? 3.0 : 1.45;
    const ribbonCount = isActive ? 3 : 2;
    const baseAlpha = alpha * (isActive ? 0.92 : 0.48);

    const palette =
      stState === STONE_STATES.HAS_ROOT && activeRoot === 'tam_linh_can'
        ? ['#ff6b6b', '#ffd166', '#4da6ff']
        : stState === STONE_STATES.HAS_ROOT && activeRoot === 'ngu_tap_can'
          ? ['#f5d76e', '#5cd65c', '#4da6ff', '#ff6b6b', '#d9a76a']
          : stState === STONE_STATES.TESTING
            ? ['#7df9ff', '#ffe066', '#9ef8d2']
            : ['#7df9ff', '#b8f2e6'];

    for (let r = 0; r < ribbonCount; r++) {
      const tilt = (r % 2 === 0 ? 1 : -1) * (0.22 + r * 0.08);
      const rx = (22 + r * 5) * scale;
      const ry = (8.5 + r * 2) * scale;
      const yOffset = (r - (ribbonCount - 1) * 0.5) * 8 * scale;
      const phase = t * speed * (r % 2 === 0 ? 1 : -0.85) + (r * Math.PI * 2) / ribbonCount;
      const col = palette[r % palette.length];

      ctx.save();
      ctx.translate(cx, cy + yOffset);
      ctx.rotate(tilt);

      // Vẽ 14 hạt/đoạn lụa nối tiếp tạo thành quỹ đạo elip 3D có chiều sâu trước/sau viên đá
      const steps = 16;
      for (let s = 0; s < steps; s++) {
        const tailFrac = s / steps;
        const ang = phase - tailFrac * 2.15;
        const sinA = Math.sin(ang);
        // sinA >= 0 là nửa phía trước viên đá (gần người xem), sinA < 0 là nửa phía sau viên đá
        if (isFront ? sinA < -0.05 : sinA >= 0.05) continue;

        const px = Math.cos(ang) * rx;
        const py = sinA * ry;
        const segAlpha = baseAlpha * (1 - tailFrac * 0.82) * (isFront ? 0.95 : 0.62);
        if (segAlpha <= 0.02) continue;

        ctx.globalAlpha = segAlpha;
        ctx.fillStyle = s < 2 ? '#ffffff' : col;
        const dotSize = Math.max(1.4, (1 - tailFrac * 0.55) * (isActive ? 3.4 : 2.3) * scale);
        ctx.fillRect(Math.round(px - dotSize / 2), Math.round(py - dotSize / 2), Math.round(dotSize), Math.round(dotSize));
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawObservationStoneAndFX(ctx, t) {
    ctx.save();
    const sx = STONE_POS.x;
    const sy = STONE_POS.y;
    const sz = observationStone.z || 0;
    const scale = observationStone.scale || 1;
    const stState = observationStone.state || STONE_STATES.IDLE;

    // Nhịp lơ lửng trên không trung tại tâm hoa văn quảng trường (độ cao y ≈ 462..466 để tuyệt đối không che mặt thiếu niên đứng ở y = 518)
    const floatAmp =
      stState === STONE_STATES.NO_ROOT
        ? 1.4
        : stState === STONE_STATES.TESTING || stState === STONE_STATES.HAS_ROOT
          ? 4.0
          : 2.8;
    const floatSpeed = stState === STONE_STATES.TESTING || stState === STONE_STATES.HAS_ROOT ? 3.6 : 2.4;
    const floatBob = Math.sin(t * floatSpeed) * floatAmp + (stState === STONE_STATES.NO_ROOT ? 3 : 0);

    const centerX = sx + (observationStone.rumble ? Math.sin(t * 48) * observationStone.rumble : 0);
    const centerY = sy - 34 - sz + floatBob;

    // 1. Cột linh quang giáng thế từ thiên không khi triệu hồi hoặc bùng phát linh căn
    if (observationStone.beamAlpha > 0 || sz > 0 || stState === STONE_STATES.HAS_ROOT) {
      const bAlpha =
        stState === STONE_STATES.HAS_ROOT
          ? 0.38 + 0.16 * Math.sin(t * 7)
          : Math.max(observationStone.beamAlpha, sz / 160) * 0.82;
      const beamGrad = ctx.createLinearGradient(sx, centerY - 210, sx, sy + 10);
      if (stState === STONE_STATES.HAS_ROOT && observationStone.activeRoot === 'tam_linh_can') {
        beamGrad.addColorStop(0, 'rgba(255, 230, 120, 0)');
        beamGrad.addColorStop(0.5, `rgba(255, 215, 100, ${(bAlpha * 0.5).toFixed(2)})`);
        beamGrad.addColorStop(1, `rgba(255, 248, 195, ${(bAlpha * 0.85).toFixed(2)})`);
      } else {
        beamGrad.addColorStop(0, 'rgba(180, 255, 245, 0)');
        beamGrad.addColorStop(0.45, `rgba(110, 235, 225, ${(bAlpha * 0.55).toFixed(2)})`);
        beamGrad.addColorStop(1, `rgba(215, 255, 250, ${(bAlpha * 0.85).toFixed(2)})`);
      }
      ctx.fillStyle = beamGrad;
      ctx.fillRect(sx - 20, centerY - 200, 40, Math.max(120, sy + 10 - (centerY - 200)));

      // Các vệt sáng phù văn rơi dọc theo luồng linh quang triệu hồi
      for (let i = 0; i < 6; i++) {
        const dropY = centerY - 170 + ((t * 110 + i * 32) % 185);
        const dropX = sx + Math.sin(i * 2.1 + t * 3) * 12;
        ctx.fillStyle = i % 2 === 0 ? `rgba(255, 248, 185, ${bAlpha})` : `rgba(155, 255, 250, ${bAlpha})`;
        ctx.fillRect(Math.round(dropX) - 1, Math.round(dropY) - 4, 2, 8);
      }
    }

    // 2. Vẽ NỬA SAU của vòng xoáy linh khí 3D (nằm phía sau thân Quan Trắc Thạch)
    drawOrbitalQiHalf(
      ctx,
      centerX,
      centerY,
      scale,
      t,
      stState,
      observationStone.activeRoot,
      observationStone.alpha,
      false
    );

    // 3. Chọn và vẽ DUY NHẤT 1 thân tinh thể Quan Trắc Thạch theo đúng trạng thái (không vẽ 2 viên đá chồng kích thước khác nhau)
    const floatFrameIdx = Math.floor((t * 1000) / 200) % 4;
    const floatSprite = getStoneDrawable('float' + floatFrameIdx) || getStoneDrawable('float0');
    // Dùng 2 frame linh khí đầy đủ nhất (06 & 07) kết hợp xoay góc mượt để không bị khuyết nửa bên phải như frame 08-09
    const qiSpriteA = getStoneDrawable('qi0');
    const qiSpriteB = getStoneDrawable('qi1') || qiSpriteA;

    let drewWebPSprite = false;

    if (sz > 4 || observationStone.activeRoot === 'five_intro') {
      // Đang triệu hồi từ không trung hạ xuống: dùng 01_quan_trac_thach_trieu_hoi.webp
      const summonSprite = getStoneDrawable('summon');
      if (summonSprite) {
        drewWebPSprite = drawCenteredSprite(
          ctx,
          summonSprite,
          centerX,
          centerY,
          88 * scale,
          98 * scale,
          observationStone.alpha
        );
      }
    } else if (stState === STONE_STATES.IDLE || stState === STONE_STATES.RESET) {
      // Trạng thái 10: Chưa kích hoạt / Trạng thái chờ (dùng 10_trang_thai_cho.webp làm tinh thể chính; fallback sang floatSprite nếu đang tải)
      const idleSprite = getStoneDrawable('stateIdle');
      const breatheAlpha = stState === STONE_STATES.RESET ? 0.82 : 0.92 + 0.08 * Math.sin(t * 2.8);
      if (idleSprite) {
        drewWebPSprite = drawCenteredSprite(
          ctx,
          idleSprite,
          centerX,
          centerY,
          56 * scale,
          78 * scale,
          observationStone.alpha * breatheAlpha
        );
      } else if (floatSprite) {
        drewWebPSprite = drawCenteredSprite(
          ctx,
          floatSprite,
          centerX,
          centerY,
          36 * scale,
          64 * scale,
          observationStone.alpha * breatheAlpha
        );
      }
    } else if (stState === STONE_STATES.TESTING) {
      // Trạng thái 11: Đang khảo nghiệm (11_dang_khao_nghiem.webp)
      const testingSprite = getStoneDrawable('stateTesting') || floatSprite;
      if (testingSprite) {
        drewWebPSprite = drawCenteredSprite(
          ctx,
          testingSprite,
          centerX,
          centerY,
          60 * scale,
          84 * scale,
          observationStone.alpha
        );
      }
    } else if (stState === STONE_STATES.NO_ROOT) {
      // Trạng thái 12: Không có linh căn (12_khong_co_linh_can.webp — ánh sáng yếu dần rồi tắt)
      const noRootSprite = getStoneDrawable('stateNoRoot');
      const dimProgress = Math.min(1, observationStone.stateTimer / 0.85);
      if (noRootSprite) {
        drewWebPSprite = drawCenteredSprite(
          ctx,
          noRootSprite,
          centerX,
          centerY + 1,
          54 * scale,
          76 * scale,
          observationStone.alpha * (1 - dimProgress * 0.15)
        );
      }
    } else if (stState === STONE_STATES.HAS_ROOT) {
      // Trạng thái 13 (Có linh căn) & 14 (Linh căn xuất sắc)
      const summonSprite = getStoneDrawable('summon');
      const hasRootSprite = getStoneDrawable('stateHasRoot');
      const excellentSprite = getStoneDrawable('stateExcellent');

      if (observationStone.activeRoot === 'tam_linh_can') {
        if (summonSprite) {
          drawCenteredSprite(
            ctx,
            summonSprite,
            centerX,
            centerY,
            92 * scale,
            102 * scale,
            observationStone.alpha * (0.45 + 0.2 * Math.sin(t * 8))
          );
        }
        const mainRootSprite = excellentSprite || hasRootSprite;
        if (mainRootSprite) {
          drewWebPSprite = drawCenteredSprite(
            ctx,
            mainRootSprite,
            centerX,
            centerY,
            64 * scale,
            88 * scale,
            observationStone.alpha
          );
        }
      } else {
        // Tiểu Phàm — Ngũ Hành Tạp Linh Căn: luân chuyển giữa 13 (Lục), 11 (Kim), 14 (Hoàng Kim) cùng kích thước đồng nhất
        const cycle = Math.floor(t * 6) % 3;
        const primarySprite =
          cycle === 0
            ? hasRootSprite
            : cycle === 1
              ? getStoneDrawable('stateTesting') || hasRootSprite
              : excellentSprite || hasRootSprite;
        if (primarySprite) {
          drewWebPSprite = drawCenteredSprite(
            ctx,
            primarySprite,
            centerX,
            centerY,
            60 * scale,
            84 * scale,
            observationStone.alpha
          );
        }
      }
    }

    // 4. Fallback Vector Tinh Thể Lơ Lửng (dùng khi ảnh WebP đang tải hoặc trong môi trường test Node)
    if (!drewWebPSprite) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);

      ctx.fillStyle = stState === STONE_STATES.NO_ROOT ? '#3b4a5e' : '#1b5e7a';
      ctx.strokeStyle =
        stState === STONE_STATES.NO_ROOT
          ? '#7c8ba1'
          : stState === STONE_STATES.HAS_ROOT
            ? '#ffe066'
            : '#7df9ff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(16, 0);
      ctx.lineTo(0, 28);
      ctx.lineTo(-16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = stState === STONE_STATES.NO_ROOT ? 'rgba(140, 160, 185, 0.35)' : 'rgba(185, 245, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(-16, 0);
      ctx.lineTo(0, 28);
      ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle =
        stState === STONE_STATES.NO_ROOT
          ? 'rgba(155, 170, 185, 0.38)'
          : stState === STONE_STATES.HAS_ROOT
            ? '#fff3a1'
            : '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2, -11);
      ctx.bezierCurveTo(-7, -5, 7, 4, -2, 11);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Vẽ vòng linh khí WebP (06 & 07) xoay tròn mượt mà + NỬA TRƯỚC của vòng xoáy linh khí 3D (nằm phía trước thân Quan Trắc Thạch)
    if (stState === STONE_STATES.TESTING || stState === STONE_STATES.HAS_ROOT || sz > 4) {
      const activeQi = Math.floor(t * 8) % 2 === 0 ? qiSpriteA : qiSpriteB;
      if (activeQi) {
        ctx.save();
        ctx.translate(centerX, centerY + 2);
        // Xoay nhẹ tạo cảm giác luồng khí cuộn tròn liên tục quanh thân đá
        ctx.rotate(Math.sin(t * 5) * 0.18);
        drawCenteredSprite(
          ctx,
          activeQi,
          0,
          0,
          58 * scale,
          50 * scale,
          observationStone.alpha * (stState === STONE_STATES.HAS_ROOT ? 0.92 : 0.82)
        );
        ctx.restore();
      }
    }

    drawOrbitalQiHalf(
      ctx,
      centerX,
      centerY,
      scale,
      t,
      stState,
      observationStone.activeRoot,
      observationStone.alpha,
      true
    );

    // 6. Tia cảm ứng linh lực nối từ bàn tay thiếu niên đang khảo nghiệm vào mũi dưới của Quan Trắc Thạch
    if (stState === STONE_STATES.TESTING || stState === STONE_STATES.HAS_ROOT) {
      ctx.save();
      const handX = TEST_STAND_POS.x + 8;
      const handY = TEST_STAND_POS.y - 34;
      const stoneTipY = centerY + 22 * scale;

      const linkGrad = ctx.createLinearGradient(handX, handY, centerX, stoneTipY);
      const linkCol =
        stState === STONE_STATES.HAS_ROOT && observationStone.activeRoot === 'tam_linh_can'
          ? 'rgba(255, 224, 102, 0.88)'
          : 'rgba(135, 255, 240, 0.88)';
      linkGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      linkGrad.addColorStop(0.5, linkCol);
      linkGrad.addColorStop(1, 'rgba(255, 245, 160, 0.95)');

      ctx.strokeStyle = linkGrad;
      ctx.lineWidth = 2.0 + Math.sin(t * 14) * 0.5;
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.quadraticCurveTo(
        (handX + centerX) * 0.5 + Math.sin(t * 12) * 4,
        (handY + stoneTipY) * 0.5,
        centerX,
        stoneTipY
      );
      ctx.stroke();

      // Hạt linh quang chạy dọc từ bàn tay lên Quan Trắc Thạch
      for (let pIdx = 0; pIdx < 3; pIdx++) {
        const prog = (t * 2.5 + pIdx * 0.33) % 1;
        const px = handX + (centerX - handX) * prog + Math.sin(prog * Math.PI * 2 + t * 10) * 2.5;
        const py = handY + (stoneTipY - handY) * prog;
        ctx.fillStyle = pIdx % 2 === 0 ? '#ffffff' : '#ffe885';
        ctx.fillRect(Math.round(px) - 1.5, Math.round(py) - 1.5, 3, 3);
      }
      ctx.restore();
    }

    // 7. Hạt tinh quang 4 cánh (Pixel Star Sparkles) lơ lửng quanh Quan Trắc Thạch
    if (stState !== STONE_STATES.NO_ROOT) {
      ctx.save();
      const starCount = stState === STONE_STATES.HAS_ROOT ? 8 : stState === STONE_STATES.TESTING ? 6 : 4;
      for (let i = 0; i < starCount; i++) {
        const ang = t * (stState === STONE_STATES.IDLE ? 1.2 : 2.5) + (i * Math.PI * 2) / starCount;
        const radX = (20 + (i % 2) * 7) * scale;
        const radY = (24 + (i % 3) * 5) * scale;
        const spX = Math.round(centerX + Math.cos(ang) * radX);
        const spY = Math.round(centerY + Math.sin(ang * 1.3) * radY);
        const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(t * 5 + i * 1.7));

        ctx.globalAlpha = observationStone.alpha * twinkle;
        ctx.fillStyle =
          stState === STONE_STATES.HAS_ROOT && observationStone.activeRoot === 'tam_linh_can'
            ? i % 2 === 0
              ? '#fff7b2'
              : '#ffd147'
            : i % 2 === 0
              ? '#dffcff'
              : '#fff3a6';
        ctx.fillRect(spX - 1, spY - 3, 2, 6);
        ctx.fillRect(spX - 3, spY - 1, 6, 2);
      }
      ctx.restore();
    } else if (observationStone.stateTimer < 1.2) {
      // Khi không có linh căn: tàn quang rơi nhẹ xuống rồi tắt hẳn
      ctx.save();
      const fade = Math.max(0, 1 - observationStone.stateTimer / 1.1);
      ctx.globalAlpha = observationStone.alpha * fade * 0.65;
      ctx.fillStyle = '#94a3b8';
      for (let i = 0; i < 4; i++) {
        const fx = Math.round(centerX + Math.sin(i * 2.3) * 14);
        const fy = Math.round(centerY - 6 + i * 8 + observationStone.stateTimer * 20);
        ctx.fillRect(fx - 1, fy - 2, 2, 4);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  function drawLucNham(ctx, t) {
    ctx.save();
    const lx = lucNhamEntity.x;
    const ly = lucNhamEntity.y - (lucNhamEntity.z || 0);

    ctx.translate(lx, ly);

    // Phi kiếm bạc xanh (nếu chưa thu vào tay áo)
    if (!lucNhamEntity.swordSheathed) {
      ctx.save();
      const sScale = lucNhamEntity.swordScale || 1;
      ctx.scale(sScale, sScale);

      ctx.shadowColor = '#50e3c2';
      ctx.shadowBlur = 14;

      ctx.fillStyle = '#e8f7f5';
      ctx.strokeStyle = '#4ee1a0';
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.moveTo(-28, 22);
      ctx.lineTo(28, 22);
      ctx.lineTo(36, 24);
      ctx.lineTo(0, 28);
      ctx.lineTo(-36, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#2c5a4d';
      ctx.fillRect(-5, 22, 10, 4);
      ctx.fillStyle = '#a8ffeb';
      ctx.beginPath();
      ctx.arc(0, 24, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Màng hào quang linh khí hộ thể (khi bay hoặc triệu hồi)
    if (lucNhamEntity.mode === 'fly_in' || lucNhamEntity.mode === 'fly_away' || lucNhamEntity.casting) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 44, 0, 0, Math.PI * 2);
      ctx.strokeStyle = lucNhamEntity.casting ? 'rgba(170, 255, 230, 0.72)' : 'rgba(120, 245, 220, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // Body nền lấy từ Tiểu Phàm, biến thể đạo bào Lục Nham.
    if(typeof SharedBody!=='undefined'&&SharedBody.draw){
      SharedBody.draw(ctx,{x:0,y:0,dir:lucNhamEntity.dir||'down',walk:lucNhamEntity.walk||0},t,'luc_nham');
    }else{
    const wind = Math.sin(t * 3.4) * (lucNhamEntity.z > 0 ? 3.2 : 1.3);
    const castRaise = lucNhamEntity.casting ? -10 + Math.sin(t * 10) * 3 : 0;
    const panel = (points, fill, edge) => {
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (edge) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = edge;
        ctx.stroke();
      }
    };
    ctx.save();
    ctx.translate(-1, -20);
    ctx.rotate(0.57);
    ctx.fillStyle = '#233b38';
    ctx.fillRect(-3, -27, 6, 62);
    ctx.fillStyle = '#a9ac86';
    ctx.fillRect(-3, 31, 6, 4);
    ctx.fillStyle = '#677e70';
    ctx.fillRect(-1, -25, 1.5, 56);
    ctx.fillStyle = '#d2b77c';
    ctx.fillRect(-7, -28, 14, 3);
    ctx.fillStyle = '#354d49';
    ctx.fillRect(-2, -42, 4, 14);
    ctx.fillStyle = '#dbcb9c';
    for (let i = 0; i < 3; i++) ctx.fillRect(-2, -39 + i * 4, 4, 1);
    ctx.fillRect(-3, -44, 6, 3);
    ctx.restore();

    panel([[-9, -16], [9, -16], [16 + wind, 18], [7 + wind, 21], [-1, 19], [-14 + wind, 21]], '#84927c', '#3e5149');
    panel([[-5, -16], [4, -15], [8 + wind, 17], [-3, 19], [-8, 16]], '#ede8d8');
    panel([[5, -17], [11, -16], [15 + wind, 18], [10 + wind, 20]], '#60756a');
    panel([[-9, -17], [-13, -16], [-19 + wind, 4], [-12 + wind, 8], [-4, -8]], '#98a48b', '#52655a');
    panel([[11, -17], [15, -14], [18 + wind, castRaise], [12, 4 + castRaise], [7, -6]], '#9eac93', '#52655a');
    ctx.fillStyle = '#eff0dd';
    ctx.fillRect(-16 + wind, 4, 7, 2);
    ctx.fillRect(12 + wind, castRaise, 6, 2);

    if (typeof avatarLuc !== 'undefined' && avatarLuc.complete && avatarLuc.naturalWidth) {
      ctx.drawImage(avatarLuc, -17, -51, 34, 34);
    }
    panel([[-8, -18], [1, -12], [8, -18], [9, -16], [0, -8], [-9, -15]], '#f1edde');
    panel([[-9, -9], [10, -9], [10, -5], [-10, -5]], '#455f56');
    ctx.fillStyle = '#b9a97e';
    ctx.fillRect(-1, -9, 4, 3);
    ctx.strokeStyle = '#d4d6bb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 3);
    ctx.bezierCurveTo(19, 6, 8, 13, 7, 9);
    ctx.bezierCurveTo(6, 5, 14, 8, 10, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -16);
    ctx.lineTo(7, -6);
    ctx.strokeStyle = '#857857';
    ctx.lineWidth = 2;
    ctx.stroke();

    }

    // Nhãn tên Lục Nham khi đang chủ trì trên mặt đất
    if (lucNhamEntity.z <= 5) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px system-ui';
      const label = 'Tiên sư Lục Nham';
      const w = ctx.measureText(label).width + 12;
      ctx.fillStyle = '#132a24dd';
      ctx.fillRect(-w / 2, -68, w, 15);
      ctx.fillStyle = '#a8ffeb';
      ctx.fillText(label, 0, -57);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // TƯƠNG TÁC
  // -------------------------------------------------------------
  function isNearChief(player, dist = 56) {
    if (!cachedChief || cachedChief.hidden) return false;
    return Math.hypot(cachedChief.x - player.x, cachedChief.y - player.y) <= dist;
  }

  function isAwaitingStoneTouch(player) {
    if (questData.state !== STATES.CINEMATIC_ACTIVE || cinematicStep !== 6) return false;
    return stepSubPhase === 'await_touch';
  }

  function talk(player) {
    if (isAwaitingStoneTouch(player)) {
      return triggerPhamStoneTouch(player);
    }
    if (!cachedChief) return false;
    if (dialogueActive) return true;

    cachedChief.dir = player.x > cachedChief.x ? 1 : -1;
    cachedChief.pause = 4.0;

    if (questData.state === STATES.CHIEF_APPROACHING) {
      questData.approachDelay = 0;
      saveState();
      startDialogue(SCRIPT_OPENING);
      return true;
    }

    const script = getRevisitScript();
    startDialogue(script);
    return true;
  }

  function interact(player) {
    if (isAwaitingStoneTouch(player)) {
      return triggerPhamStoneTouch(player);
    }
    if (isNearChief(player, 56)) {
      return talk(player);
    }
    return false;
  }

  // -------------------------------------------------------------
  // BẢNG NHIỆM VỤ DƯỚI AVATAR NGƯỜI CHƠI (PHƯƠNG ÁN A - CANVAS 2D)
  // -------------------------------------------------------------
  function isQuestBoardVisible() {
    if (dialogueActive) return false;
    const s = questData.state;
    return (
      s === STATES.REGISTERED ||
      s === STATES.AWAITING_SELECTION ||
      s === STATES.SELECTION_READY ||
      s === STATES.CINEMATIC_ACTIVE ||
      s === STATES.COMPLETED
    );
  }

  function getQuestHUDInfo() {
    const currentDay = typeof Villagers !== 'undefined' && Villagers.day ? Villagers.day : 1;

    if (
      questData.state === STATES.SELECTION_READY ||
      (currentDay >= 3 && questData.state !== STATES.COMPLETED && questData.state !== STATES.CINEMATIC_ACTIVE)
    ) {
      return {
        title: 'Tiên Nhân Giáng Lâm',
        tag: 'Đại Sự',
        tagColor: '#ef4444',
        objective: 'Đến Quảng Trường Làng ngay!',
        status: '⚡ Cấp báo',
        statusColor: '#ffe066',
        urgent: true,
        hint: 'Tiên nhân tiên môn sắp giáng thế tại sân làng. Mau tới xem khảo nghiệm linh căn!'
      };
    }

    if (questData.state === STATES.CINEMATIC_ACTIVE) {
      let obj = 'Chứng kiến nghi thức khảo nghiệm';
      if (cinematicStep === 6 && stepSubPhase === 'player_walk') {
        obj = 'Tiến lên trước Quan Trắc Thạch';
      } else if (cinematicStep === 6 && stepSubPhase === 'await_touch') {
        obj = 'Chạm tay vào Quan Trắc Thạch';
      }
      return {
        title: 'Khảo Nghiệm Linh Căn',
        tag: 'Kỳ Duyên',
        tagColor: '#38bdf8',
        objective: obj,
        status: 'Đang diễn ra',
        statusColor: '#67e8f9',
        urgent: cinematicStep === 6,
        hint: 'Khảo nghiệm linh căn tuần tự tại Quan Trắc Thạch.'
      };
    }

    if (questData.state === STATES.COMPLETED) {
      if (typeof ANguyetStory !== 'undefined' && ANguyetStory.getHUDInfo) {
        const interlude = ANguyetStory.getHUDInfo();
        if (interlude) return interlude;
      }
      return {title:'Tiên Duyên Khởi Đầu',tag:'Hoàn Tất',tagColor:'#b7d6a2',
        objective:'Về nhà nghỉ ngơi',status:'Đã Xong',statusColor:'#a5e3bd',urgent:false,
        hint:'Buổi khảo nghiệm đã kết thúc. Hãy về nghỉ ngơi.'};
    }

    if (questData.state === STATES.REGISTERED || questData.state === STATES.AWAITING_SELECTION) {
      const regDay = questData.registeredDay || 1;
      const targetDay = regDay + 2;
      const daysLeft = Math.max(0, targetDay - currentDay);
      const dayText = daysLeft === 0 ? 'Hôm nay giáng lâm' : `Còn ${daysLeft} ngày (Ngày ${targetDay})`;
      return {
        title: 'Tiên Duyên Khởi Đầu',
        tag: 'Chờ Đợi',
        tagColor: '#22c55e',
        objective: `Chờ tuyển chọn · ${dayText}`,
        status: `Ngày ${currentDay}`,
        statusColor: '#86efac',
        urgent: false,
        hint: 'Trưởng làng đã ghi tên ngươi vào danh sách. Hãy rèn luyện thể chất và chờ tiên nhân đến làng.'
      };
    }

    if (questData.state === STATES.CONSIDERING) {
      return {
        title: 'Tiên Duyên Khởi Đầu',
        tag: 'Cân Nhắc',
        tagColor: '#f59e0b',
        objective: 'Gặp Trưởng Làng để đổi ý',
        status: 'Suy nghĩ',
        statusColor: '#fde047',
        urgent: false,
        hint: 'Ngươi vẫn còn thời gian suy nghĩ. Hãy tìm Trưởng Làng nếu muốn ghi tên tham dự tuyển chọn.'
      };
    }

    if (questData.state === STATES.DECLINED) {
      return {
        title: 'Tiên Duyên Khởi Đầu',
        tag: 'Từ Chối',
        tagColor: '#94a3b8',
        objective: 'Có thể đổi ý với Trưởng Làng',
        status: 'An yên',
        statusColor: '#cbd5e1',
        urgent: false,
        hint: 'Ngươi đã chọn sống đời bình yên. Trước khi tiên nhân rời làng, ngươi vẫn có thể đổi ý.'
      };
    }

    return {
      title: 'Tiên Duyên Khởi Đầu',
      tag: 'Tiếp Nhận',
      tagColor: '#eab308',
      objective: 'Trò chuyện cùng Trưởng Làng',
      status: '[!] Đang chờ',
      statusColor: '#fef08a',
      urgent: false,
      hint: 'Trưởng làng có tin đại sự muốn báo cho thiếu niên trong làng.'
    };
  }

  function drawHUD(ctx, p, W, H, t, dt = 0.016) {
    if (!ctx) return;
    if (questDetailTimer > 0) questDetailTimer = Math.max(0, questDetailTimer - dt);

    phamWalkButtonRect = null;
    stoneTouchButtonRect = null;

    // Nút hỗ trợ tương tác trực tiếp trên màn hình trong lượt khảo nghiệm của Tiểu Phàm (Phân cảnh 6)
    if (questData.state === STATES.CINEMATIC_ACTIVE && cinematicStep === 6 && !dialogueActive) {
      if (stepSubPhase === 'player_walk' && !phamAutoWalk) {
        const bw = Math.min(260, W - 32);
        const bh = 38;
        const bx = Math.round((W - bw) / 2);
        const by = H - 108;
        phamWalkButtonRect = { x: bx, y: by, w: bw, h: bh };

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 8);
        ctx.fillStyle = '#142d22f2';
        ctx.fill();
        ctx.strokeStyle = '#ffd666';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.font = 'bold 12px "Noto Serif", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff3ba';
        ctx.fillText('👣 Tự động bước lên Quan Trắc Thạch ➔', bx + bw / 2, by + bh / 2);
        ctx.restore();
      } else if (stepSubPhase === 'await_touch') {
        const bw = Math.min(280, W - 32);
        const bh = 42;
        const bx = Math.round((W - bw) / 2);
        const by = H - 112;
        stoneTouchButtonRect = { x: bx, y: by, w: bw, h: bh };

        ctx.save();
        const pulse = 0.7 + 0.3 * Math.sin(t * 6);
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 8);
        ctx.fillStyle = '#173629f5';
        ctx.fill();
        ctx.strokeStyle = `rgba(120, 245, 215, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 13px "Noto Serif", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#e6fff7';
        ctx.fillText('✋ Đặt tay lên Quan Trắc Thạch', bx + bw / 2, by + bh / 2);
        ctx.restore();
      }
    }

    if (!isQuestBoardVisible()) return;

    const info = getQuestHUDInfo();
    if (!info) return;

    ctx.save();
    const hx = 12,
      hy = 12;
    const isNarrow = W < 430;
    const barW = isNarrow ? 116 : 132;
    const panelW = barW + 58;
    const qx = hx;
    const qy = hy + 50 + 6; // y = 68
    const qw = panelW;
    const qh = 42;

    // 1. Nền ngọc bích sẫm đồng nhất với Avatar Plaque
    ctx.beginPath();
    ctx.roundRect(qx, qy, qw, qh, 6);
    ctx.fillStyle = info.urgent ? '#162b20f2' : '#0e231be8';
    ctx.fill();

    // Viền kim loại hoàng đồng
    let strokeCol = '#bfa35bcc';
    if (info.urgent) {
      const pulse = 0.6 + 0.4 * Math.sin(t * 6);
      strokeCol = `rgba(255, 224, 102, ${pulse})`;
    }
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = info.urgent ? 1.5 : 1.1;
    ctx.stroke();

    // Viền ngọc trong tinh tế
    ctx.beginPath();
    ctx.roundRect(qx + 2, qy + 2, qw - 4, qh - 4, 4);
    ctx.strokeStyle = 'rgba(50, 88, 68, 0.45)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // 4 góc đinh tán đồng
    ctx.fillStyle = '#d6c07a';
    for (const [rx, ry] of [
      [qx + 4, qy + 4],
      [qx + qw - 4, qy + 4],
      [qx + 4, qy + qh - 4],
      [qx + qw - 4, qy + qh - 4]
    ]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Huy hiệu biểu tượng: Thẻ ngọc 「務」 (Nhiệm vụ)
    const iconX = qx + 8;
    const iconY = qy + 8;
    const iconS = 15;
    ctx.fillStyle = '#22150a';
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconS, iconS, 2.5);
    ctx.fill();
    ctx.strokeStyle = '#d6b567';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 8.5px "Noto Serif", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe899';
    ctx.fillText('務', iconX + iconS / 2, iconY + iconS / 2 + 0.5);

    // Đèn ngọc báo trạng thái nhỏ
    ctx.beginPath();
    ctx.arc(iconX + iconS - 1.5, iconY + iconS - 1.5, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = info.statusColor || '#86efac';
    ctx.fill();
    ctx.strokeStyle = '#11251c';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // 3. Dòng 1: Tiêu đề nhiệm vụ & Tag phân loại
    const textX = iconX + iconS + 6;
    const row1Y = qy + 13;

    ctx.font = 'bold 9.5px "Noto Serif", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000bb';
    ctx.fillText(info.title, textX + 0.5, row1Y + 0.5);
    ctx.fillStyle = info.urgent ? '#fff3ba' : '#fef2d0';
    ctx.fillText(info.title, textX, row1Y);

    // Tag trạng thái nhỏ góc phải dòng 1
    ctx.font = 'bold 7px system-ui, sans-serif';
    const tagText = info.tag;
    const tagW = ctx.measureText(tagText).width + 6;
    const tagX = qx + qw - tagW - 6;
    ctx.fillStyle = 'rgba(20, 48, 36, 0.75)';
    ctx.beginPath();
    ctx.roundRect(tagX, row1Y - 6, tagW, 11, 2);
    ctx.fill();
    ctx.strokeStyle = info.tagColor || '#d4ba75';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = info.tagColor || '#d4ba75';
    ctx.fillText(tagText, tagX + tagW / 2, row1Y);

    // 4. Dòng 2: Mục tiêu nhiệm vụ
    const row2Y = qy + 28;
    ctx.font = '8.5px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let objText = info.objective;
    const maxObjW = qw - (textX - qx) - 8;
    while (ctx.measureText(objText).width > maxObjW && objText.length > 5) {
      objText = objText.slice(0, -2) + '…';
    }

    ctx.fillStyle = '#000000aa';
    ctx.fillText(objText, textX + 0.5, row2Y + 0.5);
    ctx.fillStyle = info.urgent ? '#ffd666' : '#9dd5b8';
    ctx.fillText(objText, textX, row2Y);

    // 5. Thẻ chi tiết khi người chơi chạm/click vào (Quest Detail Popover)
    if (questDetailTimer > 0) {
      const popW = Math.min(270, W - 24);
      const popX = qx;
      const popY = qy + qh + 6;
      const lines = [`[Nhiệm vụ] ${info.title}`, `• Mục tiêu: ${info.objective}`, `• ${info.hint}`];
      const popH = lines.length * 15 + 14;

      ctx.beginPath();
      ctx.roundRect(popX, popY, popW, popH, 5);
      ctx.fillStyle = '#0b1d16f6';
      ctx.fill();
      ctx.strokeStyle = '#d6b567';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 9.5px "Noto Serif", Georgia, serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffeaa7';
      ctx.fillText(lines[0], popX + 8, popY + 12);

      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = '#d1e7dd';
      ctx.fillText(lines[1], popX + 8, popY + 28);
      ctx.fillStyle = '#a3c2b2';
      ctx.fillText(lines[2], popX + 8, popY + 43);
    }

    ctx.restore();
  }

  function handleClickHUD(cx, cy, W, player) {
    if (phamWalkButtonRect) {
      const b = phamWalkButtonRect;
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        phamAutoWalk = true;
        return true;
      }
    }
    if (stoneTouchButtonRect) {
      const b = stoneTouchButtonRect;
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        return triggerPhamStoneTouch(player);
      }
    }
    if (isAwaitingStoneTouch(player)) {
      // Cho phép nhấn trực tiếp vào vùng giữa màn hình (nơi đặt Quan Trắc Thạch)
      if (cx >= W * 0.28 && cx <= W * 0.72 && cy >= 120 && cy <= 520) {
        return triggerPhamStoneTouch(player);
      }
    }
    if (!isQuestBoardVisible()) return false;
    const hx = 12,
      hy = 12;
    const isNarrow = W < 430;
    const barW = isNarrow ? 116 : 132;
    const panelW = barW + 58;
    const qx = hx;
    const qy = hy + 50 + 6;
    const qw = panelW;
    const qh = 42;

    if (cx >= qx && cx <= qx + qw && cy >= qy && cy <= qy + qh) {
      questDetailTimer = questDetailTimer > 0 ? 0 : 4.5;
      return true;
    }
    return false;
  }

  return {
    STATES,
    CANDIDATE_STATES,
    STONE_STATES,
    AVATARS,
    SQUARE_CENTER,
    STONE_POS,
    TEST_STAND_POS,
    LUC_NHAM_STAND,
    CHIEF_SQUARE_POS,
    PHAM_SQUARE_POS,
    AHUY_SQUARE_POS,
    AHUY_PASSED_POS,
    init,
    update,
    drawGround,
    drawWorld,
    drawHUD,
    handleClickHUD,
    isQuestBoardVisible,
    getQuestHUDInfo,
    talk,
    interact,
    touchStone: triggerPhamStoneTouch,
    isNearChief,
    isAwaitingStoneTouch,
    isDialogueActive: () => dialogueActive,
    isCinematicActive: () => questData.state === STATES.CINEMATIC_ACTIVE,
    isCeremonyActive: () =>
      questData.state === STATES.SELECTION_READY || questData.state === STATES.CINEMATIC_ACTIVE,
    shouldShowPhamName: () => {
      if (questData.state !== STATES.CINEMATIC_ACTIVE && questData.state !== STATES.SELECTION_READY) return true;
      return cinematicStep === 1 || cinematicStep === 6 || cinematicStep === 7 || cinematicStep === 8;
    },
    isInputLocked: () => {
      if (dialogueActive) return true;
      if (questData.state === STATES.CINEMATIC_ACTIVE) {
        // Cho phép người chơi tự điều khiển Tiểu Phàm bước lên vị trí khảo nghiệm ở Phân cảnh 6
        if (cinematicStep === 6 && stepSubPhase === 'player_walk' && !phamAutoWalk) {
          return false;
        }
        return true;
      }
      return false;
    },
    isChiefControlled: () => {
      if (questData.state === STATES.COMPLETED || questData.completed) return false;
      return (
        questData.state === STATES.CHIEF_APPROACHING ||
        questData.state === STATES.CINEMATIC_ACTIVE ||
        questData.state === STATES.SELECTION_READY ||
        dialogueActive
      );
    },
    getCameraOffset: () => cameraOffset,
    getState: () => questData.state,
    getCinematicStep: () => cinematicStep,
    getStepSubPhase: () => stepSubPhase,
    getCandidateRegistry: () => candidateRegistry,
    getObservationStone: () => observationStone,
    getLucNhamEntity: () => lucNhamEntity,
    STONE_SPRITE_DEFS,
    getStoneSprites: () => stoneSprites,
    getData: () => ({ ...questData }),
    get state() {
      return questData.state;
    },
    set state(v) {
      questData.state = v;
      saveState();
    },
    get registeredDay() {
      return questData.registeredDay;
    },
    set registeredDay(v) {
      questData.registeredDay = v;
      saveState();
    },
    get approachDelay() {
      return questData.approachDelay;
    },
    set approachDelay(v) {
      questData.approachDelay = v;
      saveState();
    },
    resetState: () => {
      questData = {
        version: 1,
        state: STATES.CHIEF_APPROACHING,
        approachDelay: 30.0,
        hasMetChief: false,
        registeredDay: null,
        choice: null,
        history: [],
        spiritualRoot: null,
        rivalryReaction: null,
        completed: false
      };
      saveState();
      closeDialogue();
      if (typeof ANguyetStory !== 'undefined' && ANguyetStory.resetState) ANguyetStory.resetState();
      hideResultCard();
      cinematicStep = 0;
      cinematicTimer = 0;
      stepSubPhase = 'init';
      stepSubTimer = 0;
      currentCandidateIdx = 0;
      phamAutoWalk = false;
      questDetailTimer = 0;
      cameraOffset = { x: 0, y: 0 };
      targetCameraOffset = { x: 0, y: 0 };
      observationStone.visible = false;
      observationStone.state = STONE_STATES.IDLE;
      observationStone.activeRoot = null;
      lucNhamEntity.visible = false;
      initCandidateRegistry();
      if (typeof AHuy !== 'undefined') {
        AHuy.hidden = false;
        AHuy.reachingStone = false;
        AHuy.showCeremonyName = false;
        if (typeof AHuy.takeScenePosition === 'function') {
          AHuy.takeScenePosition(295, 335, -1);
        }
      }
      if (cachedChief) {
        cachedChief.state = 'work';
        cachedChief.x = 480;
        cachedChief.y = 350;
        cachedChief.home = [480, 350];
        cachedChief.dir = -1;
        cachedChief.route = [];
        cachedChief.walk = 0;
        cachedChief.pause = 0;
        cachedChief.spokenLine = '';
        cachedChief.reachingStone = false;
        cachedChief.showCeremonyName = false;
      }
    },
    startDialogue,
    closeDialogue,
    completeQuest,
    showToast,
    get cachedChief() {
      return cachedChief;
    }
  };
})();
