const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// 1. Mock Canvas context & DOM environment
const g = new Proxy(
  {
    measureText: () => ({ width: 80 })
  },
  {
    get(o, k) {
      if (k in o) return o[k];
      return (...args) => {
        for (const arg of args) {
          if (typeof arg === 'number') assert(Number.isFinite(arg), k + ' ' + arg);
        }
        if (k.includes('Gradient')) return { addColorStop() {} };
        return {};
      };
    },
    set(o, k, v) {
      o[k] = v;
      return true;
    }
  }
);

const domElements = new Map();
function createMockEl() {
  let html = '';
  return {
    hidden: true,
    textContent: '',
    children: [],
    get innerHTML() { return html; },
    set innerHTML(v) { html = v; if (!v) this.children = []; },
    src: '',
    alt: '',
    style: {},
    getContext: () => g,
    addEventListener() {},
    appendChild(child) { this.children.push(child); return child; },
    querySelector: () => null,
    querySelectorAll: () => [],
    focus() {}
  };
}

function getMockElement(id) {
  if (!domElements.has(id)) {
    domElements.set(id, createMockEl());
  }
  return domElements.get(id);
}

const mockLocalStorage = {
  store: new Map(),
  getItem(k) { return this.store.get(k) || null; },
  setItem(k, v) { this.store.set(k, String(v)); },
  removeItem(k) { this.store.delete(k); },
  clear() { this.store.clear(); }
};

const sandbox = {
  console,
  setTimeout(fn) { if (typeof fn === 'function') fn(); return 1; },
  clearTimeout() {},
  setInterval() {},
  clearInterval() {},
  requestAnimationFrame(cb) { cb(16); return 1; },
  Image: class {
    constructor() { this.src = ''; }
    decode() { return Promise.resolve(); }
  },
  document: {
    getElementById: (id) => getMockElement(id),
    createElement: (tag) => createMockEl(),
    body: createMockEl()
  },
  localStorage: mockLocalStorage,
  AudioContext: class {
    constructor() { this.currentTime = 0; this.state = 'running'; }
    createOscillator() { return { type: 'sine', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
    createBiquadFilter() { return { type: 'lowpass', frequency: { setValueAtTime() {} }, Q: { setValueAtTime() {} }, connect() {} }; }
    createBuffer(c, l, r) { return { getChannelData: () => new Float32Array(l) }; }
    createBufferSource() { return { connect() {}, start() {} }; }
    get destination() { return {}; }
  },
  Villagers: {
    day: 3,
    minutes: 480
  },
  TieuPhamHome: {
    inside: true,
    pose: 'none',
    exit() { this.inside = false; }
  },
  Quest1: {
    getState() { return 'completed'; }
  }
};

const code = fs.readFileSync(__dirname + '/../public/game/quest2.js', 'utf8');
vm.createContext(sandbox);
vm.runInContext(code + '; this.Quest2 = Quest2;', sandbox);

const Quest2 = sandbox.Quest2;

console.log('--- BẮT ĐẦU KIỂM THỬ NHIỆM VỤ 2: HUYẾT DẠ YÊU ẢNH ---');

// TEST 1: Khởi tạo và kiểm tra trạng thái mở khóa sau Quest 1
Quest2.init();
assert.strictEqual(Quest2.getState(), 'ready_to_rest', 'Quest 2 phải chuyển sang ready_to_rest khi Quest 1 completed');
console.log('✓ TEST 1: Mở khóa Quest 2 sau khi Quest 1 hoàn thành thành công.');

// TEST 2: Kích hoạt khi Tiểu Phàm nằm ngủ trên giường
const player = { x: 548, y: 198, dir: 'left', walk: 0 };
const startedRest = Quest2.triggerRestAtHome(player);
assert.strictEqual(startedRest, true, 'triggerRestAtHome phải trả về true');
assert.strictEqual(Quest2.getState(), 'sleeping_start', 'State phải chuyển sang sleeping_start');
console.log('✓ TEST 2: Kích hoạt ngủ tại nhà thành công.');

// TEST 3: Chuyển cảnh sang nửa đêm 00:00 (MIDNIGHT_WAKE)
Quest2.update(2.0, 2.0, player, sandbox.Villagers);
assert.strictEqual(Quest2.getState(), 'midnight_wake', 'Sau 1.6s ngủ, phải thức giấc lúc 00:00');
assert.strictEqual(sandbox.Villagers.minutes, 0, 'Giờ trong làng phải đổi thành 00:00');
assert.strictEqual(player.x, 532, 'Tiểu Phàm phải đứng cạnh giường để chống kẹt');
console.log('✓ TEST 3: Bừng tỉnh lúc 00:00 & chống kẹt giường thành công.');

// TEST 4: Bóng đen ngoài cửa sổ (WINDOW_SHADOW)
Quest2.update(2.5, 4.5, player, sandbox.Villagers);
assert.strictEqual(Quest2.getState(), 'window_shadow', 'Phải chuyển sang cảnh bóng đen ngoài cửa sổ');
console.log('✓ TEST 4: Cảnh bóng đen Liệp Ma ngoài cửa sổ hiển thị thành công.');

// TEST 5: Đếm ngược 10 giây sinh tử (COUNTDOWN_HIDE)
Quest2.update(4.0, 8.5, player, sandbox.Villagers);
assert.strictEqual(Quest2.getState(), 'countdown_hide', 'Phải chuyển sang đếm ngược 10 giây sinh tử');
console.log('✓ TEST 5: Đồng hồ đếm ngược 10 giây sinh tử hoạt động chuẩn xác.');

// TEST 6: Nhánh chết khi chọn Gầm Giường (ATTACK_BED) -> Liệp Ma đập nát giường & cào xé người chơi về 0 HP
Quest2.chooseHideSpot('bed', player);
assert.strictEqual(Quest2.getState(), 'attack_bed', 'State phải chuyển sang attack_bed');
assert.strictEqual(Quest2.isWallBroken(), true, 'Liệp Ma phải phá vỡ 1 mảng tường lớn và đi vào');
// Cập nhật tới thời điểm giường vỡ (1.0s)
Quest2.update(1.2, 9.7, player, sandbox.Villagers);
assert.strictEqual(Quest2.isBedBroken(), true, 'Giường phải bị đập nát vụn');

// Đòn tấn công 1 (1.8s): -50 HP -> người chơi còn 50 HP (chưa chết)
Quest2.update(0.8, 10.5, player, sandbox.Villagers);
assert.strictEqual(player.hp, 50, 'Sau đòn cào đầu tiên của Liệp Ma, HP người chơi phải còn 50');

// Đòn tấn công 2 kết liễu (2.7s): -50 HP -> HP về 0, gục ngã
Quest2.update(1.0, 11.5, player, sandbox.Villagers);
assert.strictEqual(player.hp, 0, 'Yêu ma tấn công: CHỈ KHI HP VỀ 0 MỚI TÍNH LÀ TỬ VONG');
assert.strictEqual(player.knockedDown, true, 'Tiểu Phàm ngã gục khi HP về 0');
console.log('✓ TEST 6: Liệp Ma đập nát giường, tấn công trừ HP tuần tự và chỉ tính tử vong khi HP về 0.');

// Helper để bước tới countdown_hide
function advanceToCountdown() {
  for (let i = 0; i < 30; i++) {
    Quest2.update(0.5, i * 0.5, player, sandbox.Villagers);
    if (Quest2.getState() === 'countdown_hide') break;
  }
}

// TEST 7: Nhánh chết khi chọn Trong Tủ (ATTACK_WARDROBE) -> Liệp Ma xé toạc cửa tủ & cắn xé về 0 HP
Quest2.resetState();
sandbox.Quest1.getState = () => 'completed';
Quest2.init();
player.hp = 100;
player.knockedDown = false;
Quest2.triggerRestAtHome(player);
advanceToCountdown();
assert.strictEqual(Quest2.getState(), 'countdown_hide', 'Phải tới countdown_hide');
Quest2.chooseHideSpot('wardrobe', player);
assert.strictEqual(Quest2.getState(), 'attack_wardrobe', 'State phải chuyển sang attack_wardrobe');
assert.strictEqual(Quest2.isWallBroken(), true, 'Liệp Ma phải phá vỡ 1 mảng tường lớn');
// Tủ bị xé toạc (1.0s)
Quest2.update(1.2, 11.2, player, sandbox.Villagers);
assert.strictEqual(Quest2.isWardrobeBroken(), true, 'Cửa tủ phải bị giật tung toác');
// Đòn 1 (1.8s) -> 50 HP
Quest2.update(0.8, 12.0, player, sandbox.Villagers);
assert.strictEqual(player.hp, 50, 'Đòn cào 1 trừ 50 HP còn 50');
// Đòn 2 (2.7s) -> 0 HP
Quest2.update(1.0, 13.0, player, sandbox.Villagers);
assert.strictEqual(player.hp, 0, 'Liệp Ma kết liễu khiến HP về 0');
console.log('✓ TEST 7: Liệp Ma xé toạc cửa tủ, tấn công trừ HP về 0 thành công.');

// TEST 8: Nhánh sinh tồn trong Chum Nước (HIDING_JAR) -> Sống sót
Quest2.resetState();
Quest2.init();
player.hp = 100;
player.knockedDown = false;
Quest2.triggerRestAtHome(player);
advanceToCountdown();
Quest2.chooseHideSpot('jar', player);
assert.strictEqual(Quest2.getState(), 'hiding_jar', 'State phải chuyển sang hiding_jar');
assert.strictEqual(Quest2.isWallBroken(), true, 'Liệp Ma phải phá vỡ 1 mảng tường lớn và đi vào');
// Cập nhật qua hoạt cảnh Liệp Ma vào nhà phá giường tủ và gõ chum
Quest2.update(3.5, 13.5, player, sandbox.Villagers);
assert.strictEqual(Quest2.isBedBroken(), true, 'Liệp Ma phá nát giường');
assert.strictEqual(Quest2.isWardrobeBroken(), true, 'Liệp Ma xé toạc tủ');
Quest2.update(5.0, 18.5, player, sandbox.Villagers);
assert.strictEqual(Quest2.getState(), 'after_decision', 'Sau khi Liệp Ma bỏ đi, chuyển sang bước ngoặt hành động');
console.log('✓ TEST 8: Nấp trong chum nước an toàn, Liệp Ma bỏ đi thành công.');

// TEST 9: Nhánh A: Chạy trốn ngoài làng (CHASE_VILLAGE) -> Liệp Ma đuổi kịp, tấn công trừ máu về 0
// Khi đang trong chum, chạm màn hình hoặc bấm nút/di chuyển sẽ trèo ra ngoài
const okClickLeave = Quest2.handleClick(400, 380, player);
assert.strictEqual(okClickLeave, true, 'Click vào màn hình để trèo ra khỏi chum');
assert.strictEqual(Quest2.getState(), 'chase_village', 'Phải chuyển sang chase_village');
assert.strictEqual(player.hp, 100, 'Khởi đầu chạy trốn với 100 HP');

// Liệp Ma rượt đuổi và bắt kịp Tiểu Phàm
player.x = 200;
player.y = 200;
Quest2.update(0.1, 19.0, player, sandbox.Villagers);
// Cho Liệp Ma vồ cào đòn 1: -50 HP -> còn 50 HP
for (let i = 0; i < 20; i++) {
  Quest2.update(0.1, 19.0 + i * 0.1, player, sandbox.Villagers);
  if (player.hp === 50) break;
}
assert.strictEqual(player.hp, 50, 'Liệp Ma đuổi kịp cào trúng lưng trừ 50 HP (còn 50)');

// Đòn 2 kết liễu: -50 HP -> 0 HP
for (let i = 0; i < 20; i++) {
  Quest2.update(0.1, 21.0 + i * 0.1, player, sandbox.Villagers);
  if (player.hp === 0) break;
}
assert.strictEqual(player.hp, 0, 'Liệp Ma cắn xé kết liễu, HP về đúng 0');
assert.strictEqual(player.knockedDown, true, 'Tiểu Phàm ngã gục trên đường làng');
console.log('✓ TEST 9: Nhánh A rượt đuổi ngoài làng: Liệp Ma tấn công trừ máu tuần tự về 0 HP thành công.');

// TEST 10: Chết là chơi lại từ đầu (Permadeath -> 00:00 Nửa Đêm)
Quest2.retryFromCheckpoint(player);
assert.strictEqual(Quest2.getState(), 'midnight_wake', 'Chết phải chơi lại từ đầu lúc 00:00 nửa đêm');
assert.strictEqual(player.hp, 100, 'Hồi phục lại 100 HP khi chơi lại');
assert.strictEqual(player.knockedDown, false, 'Không còn bị knock down');
assert.strictEqual(Quest2.isBedBroken(), false, 'Giường ngủ được khôi phục nguyên trạng');
assert.strictEqual(Quest2.isWardrobeBroken(), false, 'Tủ quần áo được khôi phục nguyên trạng');
assert.strictEqual(Quest2.isWallBroken(), false, 'Mảng tường vỡ được khôi phục nguyên trạng');
assert.strictEqual(Quest2.isVillageRuined(), false, 'Làng chưa bị hoang tàn');
console.log('✓ TEST 10: Cơ chế Permadeath: Chết là chơi lại từ đầu lúc 00:00 Nửa đêm với 100 HP.');

// TEST 11: Nhánh B: Tự tương tác môi trường - kiên nhẫn ẩn mình 5s trong chum tới bình minh (06:00 sáng) -> Hoàn thành
Quest2.resetState();
Quest2.init();
player.hp = 100;
player.knockedDown = false;
Quest2.triggerRestAtHome(player);
advanceToCountdown();
Quest2.chooseHideSpot('jar', player);
Quest2.update(8.5, 30.0, player, sandbox.Villagers);
assert.strictEqual(Quest2.getState(), 'after_decision', 'Sau khi Liệp Ma bỏ đi');

// Người chơi không chạm/di chuyển, ở yên trong chum 5.0 giây
Quest2.update(5.2, 35.2, player, sandbox.Villagers);
assert.strictEqual(Quest2.getState(), 'time_skip_dawn', 'Ẩn nấp đủ 5 giây tự động chuyển sang bình minh');

// Cập nhật qua bình minh
Quest2.update(4.0, 39.2, player, sandbox.Villagers);
assert.strictEqual(Quest2.getState(), 'ruins_explore', 'Phải tới ruins_explore');
assert.strictEqual(Quest2.isVillageRuined(), true, 'Map phải chuyển sang trạng thái phế tích');
console.log('✓ TEST 11: Sống sót tới sáng bằng cách kiên nhẫn nấp trong chum, kích hoạt phế tích thành công.');

console.log('========================================================');
console.log('TẤT CẢ 11/11 BÀI KIỂM THỬ NHIỆM VỤ 2: PASS 100%!');
console.log('========================================================');
