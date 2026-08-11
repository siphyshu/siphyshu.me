const BIRTH_DATE = new Date(2003, 11, 25);

export function getAge(now: Date = new Date()): number {
  let age = now.getFullYear() - BIRTH_DATE.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > BIRTH_DATE.getMonth() ||
    (now.getMonth() === BIRTH_DATE.getMonth() && now.getDate() >= BIRTH_DATE.getDate());
  if (!hadBirthdayThisYear) age--;
  return age;
}
