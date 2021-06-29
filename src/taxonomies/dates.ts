import {Taxonomy} from '../types';

export const extractDates = (
  taxonomies: Taxonomy[],
  deleteDates = true
): {
  taxonomies: Taxonomy[];
  dates: {
    [key: number]: string; // date object
  };
} => {
  const r: {
    taxonomies: Taxonomy[];
    dates: {
      [key: number]: string; // date object
    };
  } = {
    taxonomies: [],
    dates: {},
  };

  const deletion: number[] = [];

  taxonomies.forEach((t, ti) => {
    let date: string | null = null;
    let remove = false;
    // Test for german date
    const deDate = /[0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{4}/gm;
    const potentialDEDate = t.value.match(deDate);
    if (potentialDEDate) {
      date = potentialDEDate[0];
      if (
        potentialDEDate[0] === t.value.trim() ||
        Math.abs(potentialDEDate[0].length - t.value.trim().length) < 4
      ) {
        remove = true;
      }
      if (deleteDates) {
        taxonomies[ti].value = taxonomies[ti].value.replace(deDate, '').trim();
      }
    }

    // Test for english date #1
    if (!date) {
      const enDate = /[0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}/gm;
      const potentialENDate = t.value.match(enDate);
      if (potentialENDate) {
        date = potentialENDate[0];
        if (
          potentialENDate[0] === t.value.trim() ||
          Math.abs(potentialENDate[0].length - t.value.trim().length) < 4
        ) {
          remove = true;
        }
        if (deleteDates) {
          taxonomies[ti].value = taxonomies[ti].value
            .replace(enDate, '')
            .trim();
        }
      }
    }

    // Test for year 1800 <> currentYear
    if (!date) {
      const years = /[0-9]{4}/gm;
      const potentialYears = t.value.match(years);
      if (potentialYears) {
        potentialYears.forEach(year => {
          if (
            parseInt(year) <= new Date().getFullYear() &&
            parseInt(year) >= 1800
          ) {
            date = year + '-01-01';
            if (
              t.value.trim() === year ||
              Math.abs(year.toString().length - t.value.trim().length) < 4
            ) {
              remove = true;
            }
            if (deleteDates) {
              taxonomies[ti].value = taxonomies[ti].value
                .replace(years, '')
                .trim();
            }
          }
        });
      }
    }

    if (date) {
      r.dates[t.id] = date;
    }

    if (remove) {
      deletion.push(ti);
    }
  });

  deletion.sort();
  for (let d = deletion.length - 1; d >= 0; d -= 1) {
    delete taxonomies[deletion[d]];
  }

  r.taxonomies = taxonomies.filter(t => (t ? true : false));

  return r;
};
