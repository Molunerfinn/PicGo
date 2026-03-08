import type { GalleryPhoto } from "./utils"

const testImages: string[] = [
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  "https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?w=800&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
  "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=600&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
  "https://images.unsplash.com/photo-1526547541286-73a7aaa08f2a?w=600&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
  "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1761839257961-4dce65b72d99?ixid=M3wxMjA3fDF8MXxhbGx8MXx8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1764003928826-5d870c2e7032?ixid=M3wxMjA3fDB8MXxhbGx8Mnx8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769372131380-a6cccb922301?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769631417306-a1da09f42b20?ixid=M3wxMjA3fDB8MXxhbGx8NHx8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1761931962706-6b8da093a35e?ixid=M3wxMjA3fDB8MXxhbGx8NXx8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769406525591-619fd06c678a?ixid=M3wxMjA3fDB8MXxhbGx8Nnx8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768425780577-dbb9de83171b?ixid=M3wxMjA3fDB8MXxhbGx8N3x8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257144-297ce252742e?ixid=M3wxMjA3fDF8MXxhbGx8OHx8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768797059831-d5bbab4e3d00?ixid=M3wxMjA3fDB8MXxhbGx8OXx8fHx8fHx8MTc3MDE2OTU4Mnw&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1767285897840-5dfaa6c73ee8?ixid=M3wxMjA3fDB8MXxhbGx8MTB8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769109003123-99c12ae4b23c?ixid=M3wxMjA3fDB8MXxhbGx8MTF8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769107418962-ec5ecd084014?ixid=M3wxMjA3fDB8MXxhbGx8MTJ8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769194779755-ba4fced9bccf?ixid=M3wxMjA3fDB8MXxhbGx8MTN8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1767952035856-69ffa36c1d83?ixid=M3wxMjA3fDB8MXxhbGx8MTR8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839256547-0a1cd11b6dfb?ixid=M3wxMjA3fDF8MXxhbGx8MTV8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769317996569-0a23b3f426f7?ixid=M3wxMjA3fDB8MXxhbGx8MTZ8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769541607705-3b3c5095679b?ixid=M3wxMjA3fDB8MXxhbGx8MTd8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769489086379-dcbbb66e43a2?ixid=M3wxMjA3fDB8MXxhbGx8MTh8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1768909784212-cf801c0f9c9e?ixid=M3wxMjA3fDB8MXxhbGx8MTl8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769624515276-203ad4e1abcb?ixid=M3wxMjA3fDB8MXxhbGx8MjB8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769633062146-cd681463d442?ixid=M3wxMjA3fDB8MXxhbGx8MjF8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839256602-0e28a5ab928d?ixid=M3wxMjA3fDF8MXxhbGx8MjJ8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769613704997-13a44ed4c244?ixid=M3wxMjA3fDB8MXxhbGx8MjN8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769005373138-9a4f2771a4cc?ixid=M3wxMjA3fDB8MXxhbGx8MjR8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769670385952-36414b192051?ixid=M3wxMjA3fDB8MXxhbGx8MjV8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769643501027-b454e657395b?ixid=M3wxMjA3fDB8MXxhbGx8MjZ8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769633178915-89b48169ffb5?ixid=M3wxMjA3fDB8MXxhbGx8Mjd8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1733864822174-c469c50177a8?ixid=M3wxMjA3fDB8MXxhbGx8Mjh8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258605-d1b118266ccc?ixid=M3wxMjA3fDF8MXxhbGx8Mjl8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769470292463-2808d373c35a?ixid=M3wxMjA3fDB8MXxhbGx8MzB8fHx8fHx8fDE3NzAxNjk1ODJ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769670995181-bdc30c31b2de?ixid=M3wxMjA3fDB8MXxhbGx8MzF8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769442872238-e1912656f940?ixid=M3wxMjA3fDB8MXxhbGx8MzJ8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1697385274463-cafe62965f8d?ixid=M3wxMjA3fDB8MXxhbGx8MzN8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768590342579-dfcc5681108b?ixid=M3wxMjA3fDB8MXxhbGx8MzR8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768897342682-a93e6fb93b89?ixid=M3wxMjA3fDB8MXxhbGx8MzV8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257287-3030c9300ece?ixid=M3wxMjA3fDF8MXxhbGx8MzZ8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768898822470-8910ddea6378?ixid=M3wxMjA3fDB8MXxhbGx8Mzd8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1738779001856-61660b4ebeec?ixid=M3wxMjA3fDB8MXxhbGx8Mzh8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768893888828-52288984228c?ixid=M3wxMjA3fDB8MXxhbGx8Mzl8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768886834010-c577b64ab8e0?ixid=M3wxMjA3fDB8MXxhbGx8NDB8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768813282031-2aec62eee8b7?ixid=M3wxMjA3fDB8MXxhbGx8NDF8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1761929642510-be8d4bb29b06?ixid=M3wxMjA3fDB8MXxhbGx8NDJ8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258420-5c3e2f2e2a74?ixid=M3wxMjA3fDF8MXxhbGx8NDN8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768815021727-dbed2f7d6aed?ixid=M3wxMjA3fDB8MXxhbGx8NDR8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768813387233-9fd72fb11407?ixid=M3wxMjA3fDB8MXxhbGx8NDV8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769109002985-c0ff65466052?ixid=M3wxMjA3fDB8MXxhbGx8NDZ8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1681414728888-c2360c8852f6?ixid=M3wxMjA3fDB8MXxhbGx8NDd8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769115032967-f9a7e5342ed2?ixid=M3wxMjA3fDB8MXxhbGx8NDh8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769114474398-a7aef0625ef0?ixid=M3wxMjA3fDB8MXxhbGx8NDl8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258289-72f12b0de058?ixid=M3wxMjA3fDF8MXxhbGx8NTB8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769321725396-fdb0ee42d605?ixid=M3wxMjA3fDB8MXxhbGx8NTF8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1754254834163-7d100f5a9f93?ixid=M3wxMjA3fDB8MXxhbGx8NTJ8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769167693699-ff3e3b91abb5?ixid=M3wxMjA3fDB8MXxhbGx8NTN8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769320940078-8746ee0f7055?ixid=M3wxMjA3fDB8MXxhbGx8NTR8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769458711041-554e51a58cb1?ixid=M3wxMjA3fDB8MXxhbGx8NTV8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1706625700445-992ed7a4a5e7?ixid=M3wxMjA3fDB8MXxhbGx8NTZ8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257046-84e95464cc52?ixid=M3wxMjA3fDF8MXxhbGx8NTd8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769423456200-ee3bd2784ed8?ixid=M3wxMjA3fDB8MXxhbGx8NTh8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769265114267-9b3c74e14a54?ixid=M3wxMjA3fDB8MXxhbGx8NTl8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769265114376-50b2a7528258?ixid=M3wxMjA3fDB8MXxhbGx8NjB8fHx8fHx8fDE3NzAxNjk3OTF8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1700595208280-f1242f2dc67e?ixid=M3wxMjA3fDB8MXxhbGx8NjF8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769265114301-ac3587124aa5?ixid=M3wxMjA3fDB8MXxhbGx8NjJ8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769251845951-c271e703f047?ixid=M3wxMjA3fDB8MXxhbGx8NjN8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761850648640-2ee5870ee883?ixid=M3wxMjA3fDF8MXxhbGx8NjR8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769251296969-a4c7aa0b4478?ixid=M3wxMjA3fDB8MXxhbGx8NjV8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1729068649620-5c17361782d6?ixid=M3wxMjA3fDB8MXxhbGx8NjZ8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769251301947-17be803ef470?ixid=M3wxMjA3fDB8MXxhbGx8Njd8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769251846168-6181604d0682?ixid=M3wxMjA3fDB8MXxhbGx8Njh8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769272382095-6baeab7e3b59?ixid=M3wxMjA3fDB8MXxhbGx8Njl8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1761696088078-48497832adf0?ixid=M3wxMjA3fDB8MXxhbGx8NzB8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?ixid=M3wxMjA3fDF8MXxhbGx8NzF8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769571943198-3b25d2416344?ixid=M3wxMjA3fDB8MXxhbGx8NzJ8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769558800320-5d7010795527?ixid=M3wxMjA3fDB8MXxhbGx8NzN8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769544513344-219557efdd99?ixid=M3wxMjA3fDB8MXxhbGx8NzR8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1766341850369-96dbdbf035ad?ixid=M3wxMjA3fDB8MXxhbGx8NzV8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769626124735-80cb3bb31ecb?ixid=M3wxMjA3fDB8MXxhbGx8NzZ8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769461779986-6846b8df5ccf?ixid=M3wxMjA3fDB8MXxhbGx8Nzd8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839259484-4741afbbdcbf?ixid=M3wxMjA3fDF8MXxhbGx8Nzh8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769436275855-6f3911ab11d5?ixid=M3wxMjA3fDB8MXxhbGx8Nzl8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1764032168147-ecef23cbca9c?ixid=M3wxMjA3fDB8MXxhbGx8ODB8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769679699993-83e4189c949a?ixid=M3wxMjA3fDB8MXxhbGx8ODF8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769628027250-d2a7a5a4eb64?ixid=M3wxMjA3fDB8MXxhbGx8ODJ8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769614917552-5da98a484e2e?ixid=M3wxMjA3fDB8MXxhbGx8ODN8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769380789163-cf2f0a79b20a?ixid=M3wxMjA3fDB8MXxhbGx8ODR8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258575-038fef381ee7?ixid=M3wxMjA3fDF8MXxhbGx8ODV8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769650796145-30df10357926?ixid=M3wxMjA3fDB8MXxhbGx8ODZ8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769596569191-af3209b603c2?ixid=M3wxMjA3fDB8MXxhbGx8ODd8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769648141418-4de05799b3cf?ixid=M3wxMjA3fDB8MXxhbGx8ODh8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769376860922-9cede44b6bca?ixid=M3wxMjA3fDB8MXxhbGx8ODl8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769425105570-b47c0b235933?ixid=M3wxMjA3fDB8MXxhbGx8OTB8fHx8fHx8fDE3NzAxNjk4MjZ8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769109004486-b9270b5654c1?ixid=M3wxMjA3fDB8MXxhbGx8OTF8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258671-6495fdc188b3?ixid=M3wxMjA3fDF8MXxhbGx8OTJ8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769095384079-fe74a7f1e7aa?ixid=M3wxMjA3fDB8MXxhbGx8OTN8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1754426863493-3f5cd6d70e85?ixid=M3wxMjA3fDB8MXxhbGx8OTR8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769184618473-58c1f0e294f4?ixid=M3wxMjA3fDB8MXxhbGx8OTV8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769251297393-8178b5988b08?ixid=M3wxMjA3fDB8MXxhbGx8OTZ8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769356814886-abdadde25ea7?ixid=M3wxMjA3fDB8MXxhbGx8OTd8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1755534835660-d1a16e62c6f6?ixid=M3wxMjA3fDB8MXxhbGx8OTh8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257475-4ca368dae6c3?ixid=M3wxMjA3fDF8MXxhbGx8OTl8fHx8fHx8fDE3NzAxNjk4NjV8&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769251846183-f78756a544bc?ixid=M3wxMjA3fDB8MXxhbGx8MTAwfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769251847149-88a59d9f34d1?ixid=M3wxMjA3fDB8MXxhbGx8MTAxfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769412388440-ef126310203a?ixid=M3wxMjA3fDB8MXxhbGx8MTAyfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1765465308415-c955cfde6ef7?ixid=M3wxMjA3fDB8MXxhbGx8MTAzfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769339716318-39ddd0ca8420?ixid=M3wxMjA3fDB8MXxhbGx8MTA0fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769542300531-2f9bf965260c?ixid=M3wxMjA3fDB8MXxhbGx8MTA1fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839256951-10c4468c3621?ixid=M3wxMjA3fDF8MXxhbGx8MTA2fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769614923544-1a147f778ea6?ixid=M3wxMjA3fDB8MXxhbGx8MTA3fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769268329225-5a61424086ee?ixid=M3wxMjA3fDB8MXxhbGx8MTA4fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769626124723-caf77e2f921d?ixid=M3wxMjA3fDB8MXxhbGx8MTA5fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769454842761-844bb862e92a?ixid=M3wxMjA3fDB8MXxhbGx8MTEwfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769605767701-6e5a680ef685?ixid=M3wxMjA3fDB8MXxhbGx8MTExfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769010692266-885ada9b3cb1?ixid=M3wxMjA3fDB8MXxhbGx8MTEyfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258568-fd466a93f68b?ixid=M3wxMjA3fDF8MXxhbGx8MTEzfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769628628044-769bff843c17?ixid=M3wxMjA3fDB8MXxhbGx8MTE0fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769666102080-5bc06b6da93d?ixid=M3wxMjA3fDB8MXxhbGx8MTE1fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769607590916-70161e6020db?ixid=M3wxMjA3fDB8MXxhbGx8MTE2fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769380789060-6244d5835d8e?ixid=M3wxMjA3fDB8MXxhbGx8MTE3fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1767961932888-6bd98b732200?ixid=M3wxMjA3fDB8MXxhbGx8MTE4fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768471126957-df36ac318dc1?ixid=M3wxMjA3fDB8MXxhbGx8MTE5fHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257661-c2392c65ea72?ixid=M3wxMjA3fDF8MXxhbGx8MTIwfHx8fHx8fHwxNzcwMTY5ODY1fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768562821733-be6788db0666?ixid=M3wxMjA3fDB8MXxhbGx8MTIxfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1733864775776-481ca1dec3a9?ixid=M3wxMjA3fDB8MXxhbGx8MTIyfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768727043774-04a8a3849331?ixid=M3wxMjA3fDB8MXxhbGx8MTIzfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769002240965-7cc4b129d81a?ixid=M3wxMjA3fDB8MXxhbGx8MTI0fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769008301484-4589fa2bb0ce?ixid=M3wxMjA3fDB8MXxhbGx8MTI1fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1726798006525-f8766c278de5?ixid=M3wxMjA3fDB8MXxhbGx8MTI2fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839256840-7780a45b85dc?ixid=M3wxMjA3fDF8MXxhbGx8MTI3fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769001010573-051b0482052a?ixid=M3wxMjA3fDB8MXxhbGx8MTI4fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769040344791-1a6e16d28c2c?ixid=M3wxMjA3fDB8MXxhbGx8MTI5fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769109002317-da4a97d94907?ixid=M3wxMjA3fDB8MXxhbGx8MTMwfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1764257253810-a616758aa229?ixid=M3wxMjA3fDB8MXxhbGx8MTMxfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769399287730-6e42c3990377?ixid=M3wxMjA3fDB8MXxhbGx8MTMyfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769489050916-cc095f626886?ixid=M3wxMjA3fDB8MXxhbGx8MTMzfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839256791-6a93f89fb8b0?ixid=M3wxMjA3fDF8MXxhbGx8MTM0fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769433492607-80dca9807b4c?ixid=M3wxMjA3fDB8MXxhbGx8MTM1fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1768950826392-03f7df30dd0d?ixid=M3wxMjA3fDB8MXxhbGx8MTM2fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769324760264-8eb4fb89dddd?ixid=M3wxMjA3fDB8MXxhbGx8MTM3fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769489050642-3d768e3e959a?ixid=M3wxMjA3fDB8MXxhbGx8MTM4fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769489086404-2c9d28617bc7?ixid=M3wxMjA3fDB8MXxhbGx8MTM5fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1712418420146-6ea99872ef45?ixid=M3wxMjA3fDB8MXxhbGx8MTQwfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258753-85d8eecbbc29?ixid=M3wxMjA3fDF8MXxhbGx8MTQxfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769364323382-e2de114ab151?ixid=M3wxMjA3fDB8MXxhbGx8MTQyfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769489050646-5101b88919cb?ixid=M3wxMjA3fDB8MXxhbGx8MTQzfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769521140471-6e63a7738044?ixid=M3wxMjA3fDB8MXxhbGx8MTQ0fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769376812336-847642b315a2?ixid=M3wxMjA3fDB8MXxhbGx8MTQ2fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768593049340-6e50351b4b2f?ixid=M3wxMjA3fDB8MXxhbGx8MTUwfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768612351268-29eb449a6a9a?ixid=M3wxMjA3fDB8MXxhbGx8MTUyfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768853143263-72d7e744bbc2?ixid=M3wxMjA3fDB8MXxhbGx8MTUzfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769376861011-71c5bf085c1e?ixid=M3wxMjA3fDB8MXxhbGx8MTU2fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768862042479-7ed3f209a5da?ixid=M3wxMjA3fDB8MXxhbGx8MTU3fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769010934261-ce846f3053dc?ixid=M3wxMjA3fDB8MXxhbGx8MTU4fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769226146862-6f0b1dcaddd7?ixid=M3wxMjA3fDB8MXxhbGx8MTU5fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1745386650837-89f80015ef58?ixid=M3wxMjA3fDB8MXxhbGx8MTYwfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769292169574-b5c7e5ff518f?ixid=M3wxMjA3fDB8MXxhbGx8MTYxfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257864-c6ccab7238de?ixid=M3wxMjA3fDF8MXxhbGx8MTYyfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769521140317-5c6dcd1266e7?ixid=M3wxMjA3fDB8MXxhbGx8MTYzfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769269916795-677d4cd9f40b?ixid=M3wxMjA3fDB8MXxhbGx8MTY1fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769465102293-41eac9bae23c?ixid=M3wxMjA3fDB8MXxhbGx8MTY2fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769437238858-1ba16558ba4c?ixid=M3wxMjA3fDB8MXxhbGx8MTY3fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769295767936-3cde50b135df?ixid=M3wxMjA3fDB8MXxhbGx8MTY4fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839256545-4268b03606c0?ixid=M3wxMjA3fDF8MXxhbGx8MTY5fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769353200378-a6b3d9d282ff?ixid=M3wxMjA3fDB8MXxhbGx8MTcwfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769266252387-8839e2c3c20e?ixid=M3wxMjA3fDB8MXxhbGx8MTcyfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769302706746-9887f20a75c2?ixid=M3wxMjA3fDB8MXxhbGx8MTczfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1672423154405-5fd922c11af2?ixid=M3wxMjA3fDB8MXxhbGx8MTc0fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769292169556-2029133158ea?ixid=M3wxMjA3fDB8MXxhbGx8MTc1fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257870-06874bda71b5?ixid=M3wxMjA3fDF8MXxhbGx8MTc2fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769295746989-9b2144a4e20c?ixid=M3wxMjA3fDB8MXxhbGx8MTc3fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769356814870-6a56cbc29007?ixid=M3wxMjA3fDB8MXxhbGx8MTc4fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769374455375-23cda1b8f406?ixid=M3wxMjA3fDB8MXxhbGx8MTc5fHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769399287930-7cdddd98ef3a?ixid=M3wxMjA3fDB8MXxhbGx8MTgwfHx8fHx8fHwxNzcwMTY5OTE5fA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769437238251-cd3517d8d97a?ixid=M3wxMjA3fDB8MXxhbGx8MTgxfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769516923374-db476c12f92b?ixid=M3wxMjA3fDB8MXxhbGx8MTgyfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257513-a921710a4291?ixid=M3wxMjA3fDF8MXxhbGx8MTgzfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769490315066-c67abb2ee5ab?ixid=M3wxMjA3fDB8MXxhbGx8MTg3fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769125087746-aa6891859105?ixid=M3wxMjA3fDB8MXxhbGx8MTg5fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839259494-71caddcdd6b3?ixid=M3wxMjA3fDF8MXxhbGx8MTkwfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769109001984-f1483505d625?ixid=M3wxMjA3fDB8MXxhbGx8MTkxfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1769160398702-7c1342fba018?ixid=M3wxMjA3fDB8MXxhbGx8MTkzfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768898795268-159d50f51746?ixid=M3wxMjA3fDB8MXxhbGx8MTk0fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769018552719-3bf65711db7b?ixid=M3wxMjA3fDB8MXxhbGx8MTk1fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768928969717-c39ca2cf6ed7?ixid=M3wxMjA3fDB8MXxhbGx8MTk2fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257789-20147513121a?ixid=M3wxMjA3fDF8MXxhbGx8MTk3fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1765918652483-6f05b058879e?ixid=M3wxMjA3fDB8MXxhbGx8MTk4fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768918759275-cb220bfd26a4?ixid=M3wxMjA3fDB8MXxhbGx8MTk5fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1763902426504-f8d1176fcdda?ixid=M3wxMjA3fDB8MXxhbGx8MjAxfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://plus.unsplash.com/premium_photo-1740530840078-688751aa332c?ixid=M3wxMjA3fDB8MXxhbGx8MjAyfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768849940833-88a1be7a6b44?ixid=M3wxMjA3fDB8MXxhbGx8MjAzfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839258803-21515f43190c?ixid=M3wxMjA3fDF8MXxhbGx8MjA0fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769109002468-85f8a39d5ccd?ixid=M3wxMjA3fDB8MXxhbGx8MjA1fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1768845532725-d617e417fc5f?ixid=M3wxMjA3fDB8MXxhbGx8MjA2fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769011091803-31d2f550d86a?ixid=M3wxMjA3fDB8MXxhbGx8MjA5fHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769109004977-607431134e25?ixid=M3wxMjA3fDB8MXxhbGx8MjEwfHx8fHx8fHwxNzcwMTY5OTIwfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769029550604-1036199c94ea?ixid=M3wxMjA3fDB8MXxhbGx8MjEzfHx8fHx8fHwxNzcwMTY5OTIxfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769109001988-9682771b3092?ixid=M3wxMjA3fDB8MXxhbGx8MjE1fHx8fHx8fHwxNzcwMTY5OTIxfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769063238167-d00e112147c0?ixid=M3wxMjA3fDB8MXxhbGx8MjE3fHx8fHx8fHwxNzcwMTY5OTIxfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1761839257165-44f08ed617c7?ixid=M3wxMjA3fDF8MXxhbGx8MjE4fHx8fHx8fHwxNzcwMTY5OTIxfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769107635827-0f5a0d46917e?ixid=M3wxMjA3fDB8MXxhbGx8MjIxfHx8fHx8fHwxNzcwMTY5OTIxfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769081381891-df78cb2f87e1?ixid=M3wxMjA3fDB8MXxhbGx8MjIzfHx8fHx8fHwxNzcwMTY5OTIxfA&ixlib=rb-4.1.0",
  "https://images.unsplash.com/photo-1769021488054-897e34102a9b?ixid=M3wxMjA3fDB8MXxhbGx8MjI2fHx8fHx8fHwxNzcwMTY5OTIxfA&ixlib=rb-4.1.0",
]

const imageDimensions = [
  { width: 1600, height: 900 },
  { width: 1400, height: 900 },
  { width: 1200, height: 900 },
  { width: 1600, height: 1000 },
  { width: 1500, height: 1000 },
  { width: 900, height: 1200 },
  { width: 1000, height: 1400 },
  { width: 900, height: 1300 },
  { width: 1000, height: 1500 },
  { width: 800, height: 1200 },
  { width: 1200, height: 1200 },
  { width: 1100, height: 1100 },
  { width: 1000, height: 1000 },
]

function seededRandom(seed: number) {
  return () => {
    let value = seed
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWithSeed<T>(list: T[], seed: number) {
  const result = [...list]
  const random = seededRandom(seed)
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function buildUnsplashImageUrl(src: string, width: number, height: number) {
  const url = new URL(src)
  url.searchParams.set("w", String(width))
  url.searchParams.set("h", String(height))
  url.searchParams.set("fit", "crop")
  url.searchParams.set("q", "80")
  url.searchParams.set("auto", "format")
  return url.toString()
}

function hashString(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createMockPhotos(
  providers: string[],
  collections: string[]
): GalleryPhoto[] {
  const baseDate = new Date(2026, 0, 8)
  const shuffledImages = shuffleWithSeed(testImages, 202602)
  const missingHeightRandom = seededRandom(202603)

  return shuffledImages.map((src, index) => {
    const dimension = imageDimensions[index % imageDimensions.length]
    const omitHeight = missingHeightRandom() < 0.3
    const date = new Date(baseDate)
    date.setDate(baseDate.getDate() + index)

    const provider = providers[index % providers.length]
    // TODO(v3-post-launch): Retained for data compatibility; PicGo main repo v3 UI migration can ignore collection for now.
    const collection = collections[index % collections.length]
    const sizeMb = 1.2 + (index % 5) * 0.7
    // TODO(v3-post-launch): Retained for data compatibility; PicGo main repo v3 UI migration can ignore tags for now.
    const tags =
      index % 5 === 0
        ? ["Work"]
        : index % 4 === 0
          ? ["Design"]
          : index % 3 === 0
            ? ["Meme"]
            : []

    return {
      id: hashString(src),
      imgUrl: buildUnsplashImageUrl(src, dimension.width, dimension.height),
      originImgUrl: src,
      width: dimension.width,
      height: omitHeight ? undefined : dimension.height,
      alt: `Photo ${index + 1}`,
      name: `screenshot_${20260201 + index}.png`,
      sizeMb,
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      provider,
      // TODO(v3-post-launch): Keep field for future reactivation.
      collection,
      // TODO(v3-post-launch): Keep field for future reactivation.
      tags,
    }
  })
}
