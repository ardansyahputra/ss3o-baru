// Daftar posisi/jabatan staff yang bisa dipilih admin dari dropdown di
// halaman Staff Detail (lihat components/StaffPositionForm.js). Ini dipakai
// baik di client (form) maupun server (validasi di app/api/staff/[id]/route.js)
// supaya keduanya selalu sinkron dengan satu sumber daftar yang sama.
//
// Mau tambah/ubah posisi baru? Tinggal edit array ini saja — otomatis
// muncul di dropdown-nya, tidak perlu ubah kode lain.
const POSITION_OPTIONS = [
  "Staff",
  "Area Manager",
  "Store Leader",
  "2nd Leader",
  "Admin (Shift Pagi)",
  "FW Men",
  "FW Woman",
  "Apparel",
  "ACC & FW 70%",
  "SPORT 1-2",
  "SPORT 3",
  "KIDS"
];

module.exports = { POSITION_OPTIONS };
