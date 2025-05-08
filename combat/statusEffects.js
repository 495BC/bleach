// Status effect definitions and handlers

export const Status = {
  BLEED:   'bleed',
  BURN:    'burn',
  FREEZE:  'freeze',
  TIMESTOP:'timestop',
  GUARD:   'guard'
};

export function applyStatus(target, status, duration) {
  if (!target.status) target.status = {};
  target.status[status] = duration;  // in ms
}

export function tickStatus(target, ui) {
  const now = Date.now();
  for (const [st, end] of Object.entries(target.status || {})) {
    if (now >= end) {
      delete target.status[st];
      ui.log(`${target.name} is no longer ${st}`);
    } else {
      switch (st) {
        case Status.BURN:
          const burnDmg = Math.floor(target.maxHp * 0.01);
          target.hp -= burnDmg;
          ui.log(`${target.name} takes ${burnDmg} burn damage`);
          break;
        // implement other effects...
      }
    }
  }
}
