export function birthMonthToDate({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function birthdateToMonthInput(birthdate: string | null) {
  if (!birthdate) {
    return "";
  }

  const [year, month] = birthdate.split("-");

  if (!year || !month) {
    return "";
  }

  return `${year}-${month}`;
}

export function calculateAgeYears(
  birthdate: string | null,
  referenceDate = new Date(),
) {
  if (!birthdate) {
    return null;
  }

  const [yearValue, monthValue] = birthdate.split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  let age = referenceDate.getFullYear() - year;
  const referenceMonth = referenceDate.getMonth() + 1;

  if (referenceMonth < month) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function resolveMemberAgeYears({
  ageYears,
  birthdate,
  referenceDate,
}: {
  ageYears: number | null;
  birthdate: string | null;
  referenceDate?: Date;
}) {
  return calculateAgeYears(birthdate, referenceDate) ?? ageYears;
}
