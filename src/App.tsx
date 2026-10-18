import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  Search,
  FileText,
  BookOpen,
  Info,
  ExternalLink,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Building2,
  Clock,
  Scale,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Type,
  Contrast,
  Send,
  Trash2,
  Users,
  Car,
  Home,
  Zap,
  Globe,
  CreditCard,
  Layers,
  Award,
  LayoutGrid,
  List,
  MessageCircle,
  Bot,
  User,
  Printer,
  X,
  CheckCircle2,
  FileCheck,
  Smartphone,
  SlidersHorizontal
} from 'lucide-react';

// ==========================================
// 1. KIỂU DỮ LIỆU
// ==========================================
type CategoryId =
  | 'all'
  | 'cu-tru'
  | 'can-cuoc'
  | 'tu-phap'
  | 'phuong-tien'
  | 'lien-thong'
  | 'dien-luc'
  | 'xuat-nhap-canh'
  | 'khac-vneid'
  | 'dan-su-mo-rong';

type DocReadyState = 'none' | 'paper' | 'vneid';

interface ChecklistItem {
  id: string;
  name: string;
  type: 'Bản chính' | 'Bản sao / Ảnh chụp' | 'Tích hợp VNeID' | 'Kê khai trực tuyến';
  quantity: string;
  note: string;
}

interface ScenarioOption {
  id: string;
  label: string;
  badge: string;
  description: string;
  extraRequirement?: ChecklistItem;
  rejectionWarning: string;
}

interface Procedure {
  id: string;
  tag: string;
  title: string;
  isNew?: boolean;
  category: Exclude<CategoryId, 'all'>;
  categoryName: string;
  summary: string;
  agency: string;
  duration: string;
  fee: string;
  legalBasis: string[];
  portalUrl: string;
  checklist: ChecklistItem[];
  steps: string[];
  importantNotes: string;
  customScenarios?: ScenarioOption[];
}

interface ReferenceSource {
  id: string;
  title: string;
  agency: string;
  type: string;
  description: string;
  url: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  recommendedProcedureId?: string;
}

// ==========================================
// 2. DANH MỤC NHÓM LĨNH VỰC
// ==========================================
const CATEGORIES: { id: CategoryId; name: string; nameEn: string; icon: React.ReactNode }[] = [
  { id: 'all', name: 'Tất cả lĩnh vực', nameEn: 'All Services', icon: <FileText className="w-4 h-4" /> },
  { id: 'cu-tru', name: 'Đăng ký, quản lý cư trú', nameEn: 'Residence', icon: <Users className="w-4 h-4" /> },
  { id: 'can-cuoc', name: 'Dịch vụ công Căn cước', nameEn: 'ID Card', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'tu-phap', name: 'Dịch vụ công Tư pháp', nameEn: 'Judicial Record', icon: <Scale className="w-4 h-4" /> },
  { id: 'phuong-tien', name: 'Đăng ký, quản lý phương tiện', nameEn: 'Vehicles', icon: <Car className="w-4 h-4" /> },
  { id: 'lien-thong', name: 'Dịch vụ công liên thông', nameEn: 'Interconnected', icon: <Layers className="w-4 h-4" /> },
  { id: 'dien-luc', name: 'Dịch vụ công điện lực', nameEn: 'Electricity', icon: <Zap className="w-4 h-4" /> },
  { id: 'xuat-nhap-canh', name: 'Quản lý Xuất nhập cảnh', nameEn: 'Immigration', icon: <Globe className="w-4 h-4" /> },
  { id: 'khac-vneid', name: 'Xác nhận & Đánh giá DVC', nameEn: 'Verification & Rating', icon: <Award className="w-4 h-4" /> },
  { id: 'dan-su-mo-rong', name: 'Hộ tịch, Đất đai & Việc làm', nameEn: 'Civil, Land & Jobs', icon: <Home className="w-4 h-4" /> }
];

// ==========================================
// 3. CƠ SỞ DỮ LIỆU THỦ TỤC HÀNH CHÍNH
// ==========================================
const PROCEDURES: Procedure[] = [
  // --- ĐĂNG KÝ, QUẢN LÝ CƯ TRÚ ---
  {
    id: 'thong-bao-luu-tru',
    tag: 'Miễn phí • Duyệt ngay',
    title: 'Thông báo lưu trú',
    isNew: false,
    category: 'cu-tru',
    categoryName: 'Đăng ký, quản lý cư trú',
    summary: 'Thông báo với cơ quan Công an khi có khách, người thân hoặc người thuê đến ở lại dưới 30 ngày tại hộ gia đình, cơ sở cho thuê lưu trú.',
    agency: 'Công an xã, phường, thị trấn (Thực hiện trực tuyến trên ứng dụng VNeID)',
    duration: 'Tiếp nhận và ghi nhận ngay trong ngày (Thông báo trước 23h00 hàng ngày)',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Điều 30 Luật Cư trú 2020', 'Thông tư 55/2021/TT-BCA và Thông tư 66/2023/TT-BCA'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'tblt-1', name: 'Tài khoản định danh điện tử VNeID của chủ hộ / đại diện cơ sở lưu trú', type: 'Tích hợp VNeID', quantity: '01 tài khoản', note: 'Dùng để đăng nhập và tạo yêu cầu Thông báo lưu trú.' },
      { id: 'tblt-2', name: 'Thông tin Thẻ Căn cước hoặc Hộ chiếu của người đến lưu trú', type: 'Tích hợp VNeID', quantity: 'Theo số người', note: 'Quét mã QR trên thẻ Căn cước hoặc nhập số định danh cá nhân.' },
      { id: 'tblt-3', name: 'Thông tin địa chỉ và loại hình cơ sở lưu trú', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Chọn đúng loại hình: Hộ gia đình, nhà trọ, ký túc xá, cơ sở khám chữa bệnh.' }
    ],
    steps: [
      'Bước 1: Đăng nhập ứng dụng VNeID -> Thủ tục hành chính -> Thông báo lưu trú -> Tạo mới yêu cầu.',
      'Bước 2: Chọn Cơ quan công an cấp xã nơi có chỗ ở lưu trú và loại hình cơ sở lưu trú.',
      'Bước 3: Quét mã QR trên thẻ Căn cước của người đến lưu trú, nhập thời gian lưu trú dự kiến.',
      'Bước 4: Kiểm tra thông tin và bấm "Gửi yêu cầu" trước 23h00 tối.'
    ],
    importantNotes: 'Thông báo lưu trú áp dụng cho thời gian ở dưới 30 ngày; nếu ở từ 30 ngày trở lên cần làm thủ tục Đăng ký tạm trú.'
  },
  {
    id: 'cac-thu-tuc-tam-tru',
    tag: 'Online qua VNeID • 3 ngày',
    title: 'Các thủ tục về tạm trú',
    isNew: true,
    category: 'cu-tru',
    categoryName: 'Đăng ký, quản lý cư trú',
    summary: 'Thực hiện đăng ký tạm trú mới, gia hạn tạm trú (tối đa 02 năm/lần) hoặc xóa đăng ký tạm trú khi sinh sống ngoài nơi thường trú từ 30 ngày trở lên.',
    agency: 'Công an xã, phường, thị trấn nơi tạm trú (Qua VNeID hoặc Cổng DVC Bộ Công an)',
    duration: '03 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ',
    fee: '7.000đ - 15.000đ/lần (Giảm 50% khi nộp trực tuyến theo Thông tư 62/2023/TT-BTC)',
    legalBasis: ['Điều 27, 28, 29 Luật Cư trú 2020', 'Thông tư 55/2021/TT-BCA và Thông tư 66/2023/TT-BCA'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'tt-1', name: 'Tờ khai thay đổi thông tin cư trú (Mẫu CT01 điện tử trên VNeID)', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Kê khai trực tiếp trên ứng dụng VNeID và chọn hình thức xác nhận của chủ hộ.' },
      { id: 'tt-2', name: 'Giấy tờ chứng minh chỗ ở hợp pháp (Hợp đồng thuê nhà / văn bản cho ở nhờ)', type: 'Bản sao / Ảnh chụp', quantity: '01 bản chụp', note: 'Hợp đồng thuê nhà dùng để đăng ký tạm trú không bắt buộc phải công chứng.' },
      { id: 'tt-3', name: 'Tài khoản định danh điện tử VNeID mức 2 hoặc Thẻ Căn cước', type: 'Tích hợp VNeID', quantity: '01 tài khoản', note: 'Hệ thống tự động trích xuất thông tin nhân thân của người đăng ký.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Các thủ tục về tạm trú -> Chọn Đăng ký mới / Gia hạn / Xóa tạm trú.',
      'Bước 2: Nhập địa chỉ tạm trú, thông tin chủ hộ và chọn xác nhận qua ứng dụng VNeID.',
      'Bước 3: Đính kèm ảnh chụp Hợp đồng thuê nhà và thanh toán lệ phí trực tuyến.',
      'Bước 4: Chủ hộ mở VNeID bấm xác nhận đồng ý; Công an cấp xã duyệt hồ sơ trong 03 ngày làm việc.'
    ],
    importantNotes: 'Trước khi hết hạn tạm trú 15 ngày, công dân cần thực hiện thủ tục gia hạn tạm trú trên VNeID.'
  },
  {
    id: 'cac-thu-tuc-thuong-tru',
    tag: 'Tự động chuyển khẩu',
    title: 'Các thủ tục về thường trú',
    isNew: true,
    category: 'cu-tru',
    categoryName: 'Đăng ký, quản lý cư trú',
    summary: 'Đăng ký thường trú tại chỗ ở hợp pháp mới, tách hộ gia đình, điều chỉnh thông tin cư trú hoặc xóa đăng ký thường trú.',
    agency: 'Công an xã, phường, thị trấn nơi có chỗ ở hợp pháp',
    duration: 'Tối đa 07 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ',
    fee: '10.000đ - 20.000đ/lần (Giảm 50% khi nộp trực tuyến trên VNeID)',
    legalBasis: ['Điều 20, 21, 22, 24 Luật Cư trú 2020', 'Nghị định 62/2021/NĐ-CP', 'Thông tư 66/2023/TT-BCA'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'tht-1', name: 'Tờ khai thay đổi thông tin cư trú (Mẫu CT01 điện tử)', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Có xác nhận đồng ý của chủ hộ và chủ sở hữu chỗ ở hợp pháp qua VNeID.' },
      { id: 'tht-2', name: 'Giấy tờ chứng minh chỗ ở hợp pháp (Sổ đỏ / Sổ hồng / Hợp đồng mua bán nhà)', type: 'Bản chính', quantity: '01 bản chụp rõ nét', note: 'Chụp đầy đủ các mặt của Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở.' },
      { id: 'tht-3', name: 'Giấy tờ chứng minh quan hệ nhân thân với chủ hộ (Khi nhập vào hộ người thân)', type: 'Bản sao / Ảnh chụp', quantity: '01 bản', note: 'Giấy khai sinh, Giấy chứng nhận kết hôn (Miễn nộp nếu đã có trong CSDL dân cư).' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Các thủ tục về thường trú -> Chọn trường hợp đăng ký.',
      'Bước 2: Kê khai địa chỉ thường trú mới, thông tin chủ hộ và tải lên ảnh chụp giấy tờ nhà đất.',
      'Bước 3: Chủ hộ xác nhận đồng ý trên ứng dụng VNeID.',
      'Bước 4: Cơ quan Công an thẩm định và cập nhật địa chỉ thường trú mới trên VNeID trong 07 ngày làm việc.'
    ],
    importantNotes: 'Hệ thống tự động chuyển khẩu từ nơi cũ sang nơi mới, người dân không cần về nơi cũ xin giấy chuyển hộ khẩu.'
  },
  {
    id: 'khai-bao-tam-vang',
    tag: 'Đi học xa / Nghĩa vụ quân sự',
    title: 'Khai báo tạm vắng',
    isNew: false,
    category: 'cu-tru',
    categoryName: 'Đăng ký, quản lý cư trú',
    summary: 'Khai báo khi công dân đi khỏi phạm vi cấp huyện từ 12 tháng trở lên, người trong độ tuổi nghĩa vụ quân sự đi học/đi làm xa từ 03 tháng trở lên.',
    agency: 'Công an xã, phường, thị trấn nơi cư trú (Qua VNeID hoặc Cổng DVC Bộ Công an)',
    duration: '01 ngày làm việc kể từ ngày nhận được đề nghị',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Điều 31 Luật Cư trú 2020', 'Thông tư 55/2021/TT-BCA và Thông tư 66/2023/TT-BCA'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'tv-1', name: 'Đề nghị khai báo tạm vắng (Mẫu CT03 điện tử trên VNeID)', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Ghi rõ lý do tạm vắng, thời gian tạm vắng và địa chỉ nơi đến.' },
      { id: 'tv-2', name: 'Tài khoản VNeID hoặc Thẻ Căn cước còn hiệu lực', type: 'Tích hợp VNeID', quantity: '01 tài khoản', note: 'Dùng để xác thực và gửi yêu cầu trực tuyến.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Khai báo tạm vắng -> Tạo mới yêu cầu.',
      'Bước 2: Nhập thời gian tạm vắng, lý do và địa chỉ nơi đến.',
      'Bước 3: Gửi yêu cầu và nhận kết quả Phiếu khai báo tạm vắng trên ứng dụng trong 01 ngày làm việc.'
    ],
    importantNotes: 'Sinh viên nhập học đại học xa nhà thuộc độ tuổi nghĩa vụ quân sự có thể thực hiện khai báo tạm vắng trực tuyến ngay trên VNeID.'
  },
  {
    id: 'xac-nhan-thong-tin-cu-tru',
    tag: 'Thay thế Sổ hộ khẩu giấy',
    title: 'Xác nhận thông tin về cư trú',
    isNew: false,
    category: 'cu-tru',
    categoryName: 'Đăng ký, quản lý cư trú',
    summary: 'Xin cấp văn bản Xác nhận thông tin về cư trú (Mẫu CT07) chứng minh nơi thường trú, tạm trú và các thành viên trong hộ gia đình.',
    agency: 'Bất kỳ Công an xã, phường, thị trấn nào trên toàn quốc hoặc trên ứng dụng VNeID',
    duration: '01 - 03 ngày làm việc',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Điều 17 Thông tư 55/2021/TT-BCA sửa đổi bởi Thông tư 66/2023/TT-BCA'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'ct07-1', name: 'Tờ khai yêu cầu xác nhận thông tin về cư trú trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Thông tin nhân thân và hộ gia đình được trích xuất tự động.' },
      { id: 'ct07-2', name: 'Tài khoản định danh điện tử VNeID mức 2', type: 'Tích hợp VNeID', quantity: '01 tài khoản', note: 'Dùng để nhận bản điện tử Mẫu CT07 có chữ ký số.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Xác nhận thông tin về cư trú.',
      'Bước 2: Chọn cơ quan Công an tiếp nhận và nêu mục đích xin xác nhận.',
      'Bước 3: Nhận văn bản Xác nhận thông tin về cư trú (Mẫu CT07) có giá trị sử dụng 01 năm kể từ ngày cấp.'
    ],
    importantNotes: 'Theo Thông tư 66/2023/TT-BCA, giấy Xác nhận thông tin về cư trú (CT07) có hiệu lực 01 năm kể từ ngày cấp.'
  },

  // --- DỊCH VỤ CÔNG CĂN CƯỚC ---
  {
    id: 'cap-doi-lai-the-can-cuoc',
    tag: 'Cả trẻ em & người lớn',
    title: 'Cấp, cấp đổi, cấp lại thẻ Căn cước',
    isNew: true,
    category: 'can-cuoc',
    categoryName: 'Dịch vụ công Căn cước',
    summary: 'Cấp thẻ Căn cước lần đầu (cho cả trẻ dưới 14 tuổi và người từ đủ 14 tuổi), cấp đổi khi đủ 14, 25, 40, 60 tuổi hoặc cấp lại khi mất, hư hỏng thẻ.',
    agency: 'Cơ quan quản lý căn cước Công an cấp huyện / cấp tỉnh (Đăng ký trên VNeID)',
    duration: '07 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ',
    fee: 'Miễn phí cấp lần đầu và đổi theo mốc tuổi 14, 25, 40, 60; Cấp đổi/cấp lại khác: 30.000đ - 70.000đ (Giảm 50% khi nộp trực tuyến)',
    legalBasis: ['Điều 19, 24, 25, 26 Luật Căn cước 2023 (Số 26/2023/QH15)', 'Thông tư 17/2024/TT-BCA', 'Thông tư 73/2024/TT-BTC'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'cc-1', name: 'Phiếu đề nghị giải quyết thủ tục về căn cước trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Trẻ dưới 14 tuổi do cha, mẹ thực hiện kê khai trên tài khoản VNeID của cha/mẹ.' },
      { id: 'cc-2', name: 'Thẻ CCCD / Thẻ Căn cước cũ đang sử dụng (Nếu làm thủ tục cấp đổi)', type: 'Bản chính', quantity: '01 thẻ', note: 'Nộp lại để cơ quan Công an thu hồi khi nhận thẻ mới.' },
      { id: 'cc-3', name: 'Giấy tờ chứng minh điều chỉnh thông tin (Nếu đổi do thay đổi họ tên, ngày sinh)', type: 'Bản chính', quantity: '01 bản', note: 'Chỉ cần xuất trình khi dữ liệu mới chưa cập nhật trên CSDL dân cư.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Dịch vụ công Căn cước -> Cấp, cấp đổi, cấp lại thẻ Căn cước.',
      'Bước 2: Chọn đối tượng (Bản thân hoặc Kê khai cho con dưới 14 tuổi), chọn lý do và đặt lịch hẹn.',
      'Bước 3: Trẻ dưới 6 tuổi làm 100% online không thu sinh trắc học; Người từ đủ 6 tuổi trở lên đến điểm hẹn chụp ảnh, lấy vân tay và mống mắt.',
      'Bước 4: Nhận thẻ Căn cước mới tại cơ quan Công an hoặc qua đường bưu điện.'
    ],
    importantNotes: 'Trường hợp cấp lại thẻ Căn cước do bị mất (không thay đổi thông tin sinh trắc học) có thể thực hiện toàn trình ngay trên VNeID.'
  },

  // --- DỊCH VỤ CÔNG TƯ PHÁP ---
  {
    id: 'cap-phieu-ly-lich-tu-phap',
    tag: 'Bản điện tử dùng nhiều lần',
    title: 'Cấp phiếu lý lịch tư pháp',
    isNew: false,
    category: 'tu-phap',
    categoryName: 'Dịch vụ công Tư pháp',
    summary: 'Cấp Phiếu lý lịch tư pháp số 1 và số 2 trực tuyến trên VNeID phục vụ xin việc làm, bổ sung hồ sơ công chức, du học, xuất cảnh.',
    agency: 'Ứng dụng VNeID / Cơ quan có thẩm quyền cấp Lý lịch tư pháp cấp tỉnh',
    duration: '03 - 10 ngày làm việc kể từ ngày nhận đủ yêu cầu hợp lệ',
    fee: '170.000đ - 200.000đ/lần; Sinh viên, người có công: 80.000đ - 100.000đ; Miễn phí cho người cao tuổi, khuyết tật, hộ nghèo',
    legalBasis: ['Luật Lý lịch tư pháp 2009 (sửa đổi 2014)', 'Thông tư 43/2024/TT-BTC của Bộ Tài chính'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'lltp-1', name: 'Tờ khai yêu cầu cấp Phiếu lý lịch tư pháp điện tử trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Thông tin nhân thân, cha mẹ, vợ chồng được tự động điền từ VNeID.' },
      { id: 'lltp-2', name: 'Tài khoản định danh điện tử VNeID mức độ 2', type: 'Tích hợp VNeID', quantity: '01 tài khoản', note: 'Dùng để ký xác nhận điện tử và nhận Phiếu LLTP bản điện tử.' },
      { id: 'lltp-3', name: 'Thẻ sinh viên hoặc giấy tờ chứng minh đối tượng miễn, giảm phí (Nếu có)', type: 'Bản sao / Ảnh chụp', quantity: '01 ảnh chụp', note: 'Đính kèm để được giảm 50% hoặc miễn 100% phí.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Dịch vụ công Tư pháp -> Cấp phiếu lý lịch tư pháp.',
      'Bước 2: Kiểm tra thông tin cá nhân tự động điền, chọn loại Phiếu (Số 1 hoặc Số 2) và mục đích cấp.',
      'Bước 3: Thanh toán phí trực tuyến và xác nhận gửi hồ sơ bằng Passcode VNeID.',
      'Bước 4: Nhận Phiếu lý lịch tư pháp điện tử có chữ ký số ngay trên VNeID (dùng lại được nhiều lần).'
    ],
    importantNotes: 'Phiếu lý lịch tư pháp bản điện tử trên VNeID có giá trị pháp lý như bản giấy và có thể nộp trực tuyến cho nhiều đơn vị.'
  },

  // --- ĐĂNG KÝ, QUẢN LÝ PHƯƠNG TIỆN GIAO THÔNG ---
  {
    id: 'dang-ky-xe-lan-dau',
    tag: 'Bấm biển số tại nhà',
    title: 'Đăng ký xe lần đầu',
    isNew: true,
    category: 'phuong-tien',
    categoryName: 'Dịch vụ công Đăng ký, quản lý phương tiện giao thông cơ giới đường bộ',
    summary: 'Đăng ký xe và bấm biển số định danh trực tuyến toàn trình ngay trên VNeID đối với xe ô tô, xe máy mới sản xuất, lắp ráp trong nước.',
    agency: 'Ứng dụng VNeID / Cổng DVC Bộ Công an và Công an cấp xã/huyện/Phòng CSGT',
    duration: 'Bấm biển số ngay trên ứng dụng; nhận biển số và đăng ký xe qua bưu điện trong 02 ngày làm việc',
    fee: 'Theo khu vực đăng ký (Được giảm 30% mức lệ phí khi đăng ký trực tuyến toàn trình theo Thông tư 60/2023/TT-BTC)',
    legalBasis: ['Luật Trật tự, an toàn giao thông đường bộ 2024', 'Thông tư 24/2023/TT-BCA, Thông tư 28/2024/TT-BCA và Thông tư 79/2024/TT-BCA'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'dkx-1', name: 'Giấy khai đăng ký xe điện tử trên ứng dụng VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Nhập số Phiếu kiểm tra chất lượng xuất xưởng và mã hồ sơ lệ phí trước bạ.' },
      { id: 'dkx-2', name: 'Ảnh chụp xe từ phía trước đầu xe góc 45 độ + Bản chà số máy, số khung', type: 'Bản chính', quantity: '01 ảnh + 01 bộ bản chà', note: 'Tải ảnh xe lên VNeID; bản chà số máy, số khung nộp cho bưu tá khi nhận biển số.' },
      { id: 'dkx-3', name: 'Mã hồ sơ hoàn tất nộp Lệ phí trước bạ điện tử (Qua eTax Mobile / Cổng DVC)', type: 'Kê khai trực tuyến', quantity: '01 mã', note: 'Dữ liệu thuế trước bạ được liên thông tự động từ cơ quan Thuế.' }
    ],
    steps: [
      'Bước 1: Nộp lệ phí trước bạ trực tuyến trên eTax Mobile hoặc Cổng Dịch vụ công để lấy mã hồ sơ thuế.',
      'Bước 2: Mở VNeID -> Thủ tục hành chính -> Đăng ký xe lần đầu -> Nhập số Phiếu xuất xưởng và tải ảnh chụp xe.',
      'Bước 3: Bấm nút chọn biển số định danh ngay trên màn hình VNeID và thanh toán lệ phí trực tuyến.',
      'Bước 4: Nhận Biển số xe và Chứng nhận đăng ký xe tại nhà qua dịch vụ bưu chính.'
    ],
    importantNotes: 'Không cần mang xe đến cơ quan Công an kiểm tra thực tế khi đăng ký xe sản xuất lắp ráp trong nước toàn trình trên VNeID.'
  },
  {
    id: 'sang-ten-xe-dinh-danh',
    tag: 'Theo biển số định danh',
    title: 'Đăng ký sang tên xe máy, ô tô',
    isNew: false,
    category: 'phuong-tien',
    categoryName: 'Dịch vụ công Đăng ký, quản lý phương tiện giao thông cơ giới đường bộ',
    summary: 'Chuyển quyền sở hữu xe khi mua bán, tặng cho: Chủ cũ làm thủ tục thu hồi biển số định danh, chủ mới làm thủ tục đăng ký sang tên.',
    agency: 'Công an cấp xã/huyện (xe máy) hoặc Phòng CSGT / Công an cấp huyện (ô tô)',
    duration: 'Thu hồi: 02 ngày làm việc; Cấp đăng ký xe mới: 02 ngày làm việc',
    fee: '50.000đ - 200.000đ (Chưa bao gồm lệ phí trước bạ 2% giá trị xe cũ)',
    legalBasis: ['Thông tư 24/2023/TT-BCA và Thông tư 79/2024/TT-BCA của Bộ Công an'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'stx-1', name: 'Hợp đồng mua bán, tặng cho xe có công chứng hoặc chứng thực', type: 'Bản chính', quantity: '02 bản', note: 'Công chứng tại Văn phòng công chứng hoặc chứng thực tại UBND cấp xã.' },
      { id: 'stx-2', name: 'Giấy khai thu hồi đăng ký, biển số xe + Đăng ký xe cũ + Biển số cũ', type: 'Bản chính', quantity: '01 bộ', note: 'Nộp để cơ quan đăng ký xe cấp Chứng nhận thu hồi đăng ký, biển số xe.' },
      { id: 'stx-3', name: 'Chứng từ nộp Lệ phí trước bạ (2%) + Giấy khai đăng ký xe của chủ mới', type: 'Bản chính', quantity: '01 bộ', note: 'Đưa xe cùng Chứng nhận thu hồi đến cơ quan đăng ký xe nơi chủ mới cư trú.' }
    ],
    steps: [
      'Bước 1: Hai bên mua bán ký Hợp đồng chuyển quyền sở hữu xe tại Phòng công chứng / UBND xã.',
      'Bước 2: Kê khai thu hồi trên Cổng DVC Bộ Công an, nộp lại biển số cũ + đăng ký cũ để nhận Chứng nhận thu hồi.',
      'Bước 3: Bên mua nộp lệ phí trước bạ 2% tại Chi cục Thuế hoặc qua eTax Mobile.',
      'Bước 4: Bên mua đưa xe và hồ sơ đến Công an nơi cư trú để kiểm tra số khung, số máy và cấp biển số định danh mới.'
    ],
    importantNotes: 'Trong vòng 30 ngày kể từ ngày công chứng hợp đồng mua bán xe, phải thực hiện thủ tục thu hồi biển số để tránh bị phạt.'
  },
  {
    id: 'doi-giay-phep-lai-xe',
    tag: 'Nhận bằng mới tại nhà',
    title: 'Đổi Giấy phép lái xe trực tuyến toàn trình',
    isNew: false,
    category: 'phuong-tien',
    categoryName: 'Dịch vụ công Đăng ký, quản lý phương tiện giao thông cơ giới đường bộ',
    summary: 'Đổi Giấy phép lái xe sắp hết hạn hoặc bị hư hỏng hoàn toàn trực tuyến, nhận bằng mới tại nhà và cập nhật trên VNeID.',
    agency: 'Cổng Dịch vụ công Đổi GPLX (dvc4.gplx.gov.vn) / Cổng Dịch vụ công Quốc gia',
    duration: '05 ngày làm việc kể từ khi hồ sơ hợp lệ',
    fee: '115.000đ/lần khi nộp trực tuyến (Theo Thông tư 63/2023/TT-BTC)',
    legalBasis: ['Luật Trật tự, an toàn giao thông đường bộ 2024', 'Thông tư 05/2024/TT-BGTVT', 'Thông tư 63/2023/TT-BTC'],
    portalUrl: 'https://dvc4.gplx.gov.vn',
    checklist: [
      { id: 'gplx-1', name: 'Mã Giấy khám sức khỏe điện tử của người lái xe (GKSK điện tử)', type: 'Kê khai trực tuyến', quantity: '01 mã', note: 'Khám tại cơ sở y tế có liên thông dữ liệu với Cổng dịch vụ công.' },
      { id: 'gplx-2', name: 'File ảnh chân dung 3x4 nền xanh dương + Ảnh chụp GPLX cũ và Thẻ Căn cước', type: 'Bản sao / Ảnh chụp', quantity: '01 bộ ảnh', note: 'Ảnh chân dung chụp thẳng, không đeo kính.' },
      { id: 'gplx-3', name: 'Giấy phép lái xe cũ bản vật lý', type: 'Bản chính', quantity: '01 thẻ', note: 'Nộp lại cho bưu tá cắt góc khi nhận bằng lái mới tại nhà.' }
    ],
    steps: [
      'Bước 1: Đi khám sức khỏe lái xe tại cơ sở y tế liên thông để lấy mã GKSK điện tử.',
      'Bước 2: Đăng nhập dvc4.gplx.gov.vn bằng VNeID, nhập số GPLX, mã GKSK và tải ảnh chân dung 3x4 nền xanh.',
      'Bước 3: Thanh toán lệ phí 115.000đ trực tuyến khi có thông báo duyệt hồ sơ.',
      'Bước 4: Nhận GPLX mới tại nhà qua bưu điện và đồng bộ trên VNeID.'
    ],
    importantNotes: 'Bằng lái đang bị tạm giữ hoặc chưa hoàn thành nộp phạt nguội sẽ không thể đổi trực tuyến.'
  },

  // --- DỊCH VỤ CÔNG LIÊN THÔNG ---
  {
    id: 'lien-thong-khai-sinh',
    tag: 'Combo 4 trong 1 cho bé',
    title: 'ĐK khai sinh, ĐKTT, cấp thẻ căn cước, cấp thẻ BHYT',
    isNew: true,
    category: 'lien-thong',
    categoryName: 'Dịch vụ công liên thông',
    summary: 'Giải quyết liên thông cùng lúc 04 thủ tục: Đăng ký khai sinh, Đăng ký thường trú, Cấp thẻ Căn cước và Cấp thẻ BHYT cho trẻ dưới 6 tuổi.',
    agency: 'Ứng dụng VNeID / Cổng Dịch vụ công Quốc gia (UBND xã, Công an và BHXH phối hợp)',
    duration: '03 - 05 ngày làm việc',
    fee: 'Miễn toàn bộ lệ phí khai sinh, thường trú, cấp thẻ Căn cước lần đầu và thẻ BHYT cho trẻ dưới 6 tuổi',
    legalBasis: ['Nghị định 63/2024/NĐ-CP ngày 10/06/2024', 'Luật Căn cước 2023', 'Luật Hộ tịch 2014'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'ltks-1', name: 'Tờ khai điện tử liên thông trên ứng dụng VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Kê khai 1 lần duy nhất cho cả 4 thủ tục trên ứng dụng VNeID.' },
      { id: 'ltks-2', name: 'Giấy chứng sinh điện tử hoặc bản chụp Giấy chứng sinh của bệnh viện', type: 'Bản chính', quantity: '01 bản', note: 'Nhập mã Giấy chứng sinh để tra cứu tự động hoặc đính kèm ảnh chụp.' },
      { id: 'ltks-3', name: 'Xác nhận đồng ý của chủ hộ trên ứng dụng VNeID', type: 'Tích hợp VNeID', quantity: 'Xác nhận điện tử', note: 'Chủ hộ bấm xác nhận đồng ý cho trẻ đăng ký thường trú trên VNeID.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Dịch vụ công liên thông -> ĐK khai sinh, ĐKTT, cấp thẻ căn cước, cấp thẻ BHYT.',
      'Bước 2: Điền thông tin của bé, nơi thường trú, nơi khám chữa bệnh BHYT ban đầu và tích chọn cấp thẻ Căn cước.',
      'Bước 3: Đính kèm Giấy chứng sinh và chờ chủ hộ xác nhận đồng ý trên VNeID.',
      'Bước 4: Nhận Giấy khai sinh, Thẻ BHYT, Thẻ Căn cước và kết quả thường trú tại nhà hoặc tại UBND cấp xã.'
    ],
    importantNotes: 'Trẻ dưới 6 tuổi được cấp thẻ Căn cước miễn phí ngay khi làm liên thông khai sinh mà không cần thu nhận vân tay hay chụp ảnh.'
  },
  {
    id: 'lien-thong-khai-tu',
    tag: 'Liên thông 1 cửa • Miễn phí',
    title: 'ĐK khai tử, xóa ĐK thường trú, giải quyết mai táng phí, tử tuất',
    isNew: true,
    category: 'lien-thong',
    categoryName: 'Dịch vụ công liên thông',
    summary: 'Liên thông điện tử giúp thân nhân thực hiện 1 lần để giải quyết đồng thời: Đăng ký khai tử, Xóa đăng ký thường trú và Nhận mai táng phí, tử tuất.',
    agency: 'Ứng dụng VNeID / Cổng Dịch vụ công Quốc gia',
    duration: 'Khai tử & xóa thường trú: 01 - 02 ngày; Mai táng phí, tử tuất: 07 - 15 ngày làm việc',
    fee: 'Miễn toàn bộ lệ phí (0 đồng)',
    legalBasis: ['Nghị định 63/2024/NĐ-CP ngày 10/06/2024', 'Luật Hộ tịch 2014', 'Luật Bảo hiểm xã hội'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'ltkt-1', name: 'Tờ khai điện tử liên thông trên ứng dụng VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Kê khai trực tiếp trên ứng dụng VNeID hoặc Cổng Dịch vụ công Quốc gia.' },
      { id: 'ltkt-2', name: 'Giấy báo tử hoặc văn bản thay thế Giấy báo tử', type: 'Bản chính', quantity: '01 bản chụp', note: 'Do bệnh viện hoặc cơ quan có thẩm quyền cấp.' },
      { id: 'ltkt-3', name: 'Số tài khoản ngân hàng của thân nhân nhận chế độ mai táng phí, tử tuất', type: 'Kê khai trực tuyến', quantity: '01 tài khoản', note: 'Cơ quan BHXH / LĐ-TB&XH chuyển khoản trực tiếp chế độ vào tài khoản.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công liên thông -> ĐK khai tử, xóa ĐK thường trú, giải quyết mai táng phí, tử tuất.',
      'Bước 2: Nhập thông tin người đã mất, đính kèm Giấy báo tử và chọn chế độ hưởng.',
      'Bước 3: UBND cấp xã cấp Trích lục khai tử điện tử; Công an xóa thường trú; BHXH chi trả tiền mai táng phí, tử tuất.'
    ],
    importantNotes: 'Giúp gia đình giảm bớt thủ tục giấy tờ, không phải đi lại nhiều lần giữa UBND xã, Công an và Bảo hiểm xã hội.'
  },

  // --- DỊCH VỤ CÔNG ĐIỆN LỰC ---
  {
    id: 'cap-dien-ha-ap',
    tag: 'Điện sinh hoạt & kinh doanh',
    title: 'Cấp điện mới từ lưới điện hạ áp',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Đăng ký lắp đặt công tơ và cấp điện mới từ lưới điện hạ áp (220V/380V) cho sinh hoạt hộ gia đình hoặc kinh doanh.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID / Cổng DVC Quốc gia',
    duration: 'Đô thị: không quá 03 ngày làm việc; Nông thôn: không quá 05 ngày làm việc',
    fee: 'Miễn phí khảo sát và lắp đặt từ lưới điện đến công tơ',
    legalBasis: ['Luật Điện lực', 'Nghị định 137/2013/NĐ-CP và Nghị định 104/2022/NĐ-CP'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn1-1', name: 'Yêu cầu cấp điện mới từ lưới điện hạ áp trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Thông tin nhân thân và cư trú được trích xuất tự động từ VNeID.' },
      { id: 'evn1-2', name: 'Giấy tờ xác định mục đích sử dụng điện (Nếu đăng ký điện kinh doanh, sản xuất)', type: 'Bản sao / Ảnh chụp', quantity: '01 ảnh chụp', note: 'Điện sinh hoạt hộ gia đình đã có thông tin cư trú trên VNeID không cần nộp giấy tờ nhà.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Cấp điện mới từ lưới điện hạ áp.',
      'Bước 2: Chọn địa chỉ lắp đặt, mục đích sử dụng điện và công suất.',
      'Bước 3: Điện lực khảo sát thực tế, ký hợp đồng điện tử qua OTP và đóng điện.'
    ],
    importantNotes: 'Đã bãi bỏ yêu cầu nộp bản sao Sổ hộ khẩu giấy khi đăng ký mua điện sinh hoạt.'
  },
  {
    id: 'cap-dien-trung-ap',
    tag: 'Nhà xưởng & Trạm biến áp',
    title: 'Cấp điện mới từ lưới điện trung áp',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Đăng ký cấp điện mới công suất lớn từ lưới trung áp cho nhà máy, xưởng sản xuất, tòa nhà thương mại.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID / Cổng DVC Quốc gia',
    duration: 'Trọn gói thủ tục ngành Điện không quá 05 ngày làm việc',
    fee: 'Miễn phí khảo sát và thỏa thuận đấu nối của ngành Điện',
    legalBasis: ['Luật Điện lực', 'Thông tư 24/2016/TT-BCT của Bộ Công Thương'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn2-1', name: 'Đề nghị mua điện trung áp và thông số phụ tải trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Nêu rõ công suất đăng ký và tiến độ công trình.' },
      { id: 'evn2-2', name: 'Giấy tờ xác định địa điểm mua điện / Đăng ký doanh nghiệp', type: 'Bản sao / Ảnh chụp', quantity: '01 bản chụp', note: 'Đính kèm bản điện tử trên hệ thống.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Cấp điện mới từ lưới điện trung áp.',
      'Bước 2: Điện lực khảo sát hiện trường và lập Thỏa thuận đấu nối.',
      'Bước 3: Nghiệm thu kỹ thuật, ký hợp đồng mua bán điện điện tử và đóng điện.'
    ],
    importantNotes: 'Khách hàng theo dõi được toàn bộ tiến độ khảo sát và đấu nối ngay trên VNeID.'
  },
  {
    id: 'thay-doi-chu-the-hd-dien',
    tag: 'Sang tên công tơ điện',
    title: 'Thay đổi chủ thể hợp đồng mua bán điện',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Sang tên chủ hợp đồng mua bán điện khi mua bán chuyển nhượng nhà đất hoặc thay đổi người đại diện đứng tên công tơ điện.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: '02 - 03 ngày làm việc',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Nghị định 137/2013/NĐ-CP và Nghị định 104/2022/NĐ-CP'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn3-1', name: 'Mã khách hàng sử dụng điện (In trên hóa đơn tiền điện)', type: 'Kê khai trực tuyến', quantity: '01 mã', note: 'Nhập mã khách hàng để tra cứu hợp đồng cần sang tên.' },
      { id: 'evn3-2', name: 'Giấy tờ chứng minh chủ sở hữu mới hoặc thông tin thường trú trên VNeID', type: 'Bản sao / Ảnh chụp', quantity: '01 bản chụp', note: 'Sổ đỏ, hợp đồng mua bán nhà hoặc dữ liệu cư trú trên VNeID.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Thay đổi chủ thể hợp đồng mua bán điện.',
      'Bước 2: Nhập Mã khách hàng và đính kèm thông tin chủ thể mới.',
      'Bước 3: Ký lại Hợp đồng mua bán điện điện tử đứng tên chủ mới qua mã OTP.'
    ],
    importantNotes: 'Hóa đơn tiền điện kỳ gần nhất cần được thanh toán hết trước khi hoàn tất chuyển chủ thể.'
  },
  {
    id: 'thay-doi-thong-tin-dien',
    tag: 'Đổi SĐT / Số Căn cước',
    title: 'Thay đổi thông tin đã đăng ký',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Cập nhật lại số điện thoại, email, số Thẻ Căn cước 12 số hoặc tên địa chỉ hành chính mới trên hợp đồng mua bán điện.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: '01 - 02 ngày làm việc',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Quy trình kinh doanh điện năng Tập đoàn Điện lực Việt Nam'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn4-1', name: 'Mã khách hàng sử dụng điện trên hóa đơn', type: 'Kê khai trực tuyến', quantity: '01 mã', note: 'Nhập mã khách hàng để hệ thống truy xuất thông tin.' },
      { id: 'evn4-2', name: 'Tài khoản định danh điện tử VNeID của chủ hợp đồng', type: 'Tích hợp VNeID', quantity: '01 tài khoản', note: 'Đồng bộ số Căn cước 12 số và số điện thoại chính chủ.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Thay đổi thông tin đã đăng ký.',
      'Bước 2: Nhập Mã khách hàng và thông tin mới cần điều chỉnh.',
      'Bước 3: Xác nhận gửi yêu cầu và nhận thông báo cập nhật thành công.'
    ],
    importantNotes: 'Giúp đồng bộ hóa đơn tiền điện điện tử với thông tin định danh trên VNeID.'
  },
  {
    id: 'thay-doi-muc-dich-dien',
    tag: 'Chuyển đổi biểu giá điện',
    title: 'Thay đổi mục đích sử dụng điện',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Điều chỉnh biểu giá điện khi chuyển từ điện sinh hoạt sang kinh doanh, sản xuất hoặc từ kinh doanh về lại điện sinh hoạt.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: 'Không quá 03 ngày làm việc',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Thông tư 16/2014/TT-BCT và Thông tư 09/2023/TT-BCT của Bộ Công Thương'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn5-1', name: 'Yêu cầu thay đổi mục đích sử dụng điện kèm Mã khách hàng trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Chọn mục đích mới: Sinh hoạt / Kinh doanh / Sản xuất.' },
      { id: 'evn5-2', name: 'Giấy đăng ký hộ kinh doanh / doanh nghiệp (Nếu chuyển sang điện kinh doanh, sản xuất)', type: 'Bản sao / Ảnh chụp', quantity: '01 ảnh chụp', note: 'Không cần giấy tờ này nếu xin chuyển từ điện kinh doanh về lại điện sinh hoạt.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Thay đổi mục đích sử dụng điện.',
      'Bước 2: Nhập Mã khách hàng và chọn mục đích sử dụng điện mới.',
      'Bước 3: Điện lực kiểm tra phụ tải, chốt chỉ số công tơ và ký phụ lục áp giá điện mới.'
    ],
    importantNotes: 'Khi ngừng kinh doanh tại nhà, chủ hộ nên làm thủ tục này ngay để được tính lại giá điện bậc thang sinh hoạt.'
  },
  {
    id: 'thay-doi-dinh-muc-dien',
    tag: 'Định mức nhà trọ / Nhiều hộ',
    title: 'Thay đổi định mức sử dụng điện',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Đăng ký cấp thêm định mức bậc thang điện sinh hoạt khi nhiều hộ dùng chung công tơ hoặc đăng ký định mức điện cho sinh viên, người lao động thuê trọ.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: 'Không quá 03 ngày làm việc',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Thông tư 16/2014/TT-BCT, Thông tư 25/2018/TT-BCT và Thông tư 09/2023/TT-BCT'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn6-1', name: 'Đề nghị thay đổi định mức sử dụng điện kèm Mã khách hàng trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Kê khai số người thuê trọ hoặc số hộ gia đình dùng chung công tơ.' },
      { id: 'evn6-2', name: 'Thông tin đăng ký tạm trú trên VNeID của người thuê trọ / Hợp đồng thuê nhà', type: 'Tích hợp VNeID', quantity: '01 bản', note: 'Cứ 04 người thuê trọ được tính là 01 hộ dùng điện để hưởng đủ định mức bậc thang sinh hoạt.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Thay đổi định mức sử dụng điện.',
      'Bước 2: Nhập Mã khách hàng và danh sách người thuê trọ / hộ dùng chung.',
      'Bước 3: Ký phụ lục điều chỉnh số định mức bậc thang điện sinh hoạt trực tuyến.'
    ],
    importantNotes: 'Giúp người thuê trọ được mua điện đúng giá bậc thang sinh hoạt của Nhà nước.'
  },
  {
    id: 'gia-han-hd-dien',
    tag: 'Ký số trực tuyến OTP',
    title: 'Gia hạn hợp đồng mua bán điện',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Gia hạn thời gian hiệu lực của Hợp đồng mua bán điện sắp hết hạn trực tuyến trên VNeID.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: '02 - 03 ngày làm việc',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Nghị định 137/2013/NĐ-CP và Nghị định 104/2022/NĐ-CP'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn7-1', name: 'Mã khách hàng sử dụng điện cần gia hạn hợp đồng', type: 'Kê khai trực tuyến', quantity: '01 mã', note: 'Nhập trên biểu mẫu điện tử của VNeID.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Gia hạn hợp đồng mua bán điện.',
      'Bước 2: Kiểm tra thông tin hợp đồng và xác nhận ký số bằng mã OTP.'
    ],
    importantNotes: 'Không cần đến trực tiếp quầy giao dịch Điện lực để ký gia hạn giấy.'
  },
  {
    id: 'cham-dut-hd-dien',
    tag: 'Thanh lý khi trả mặt bằng',
    title: 'Chấm dứt hợp đồng mua bán điện',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Thanh lý và chấm dứt Hợp đồng mua bán điện khi chuyển nhà, trả mặt bằng thuê hoặc không còn nhu cầu sử dụng điện.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: 'Không quá 03 ngày làm việc',
    fee: 'Miễn phí thủ tục (Chỉ tất toán tiền điện đã dùng đến ngày chốt chỉ số)',
    legalBasis: ['Luật Điện lực', 'Nghị định 137/2013/NĐ-CP'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn8-1', name: 'Yêu cầu chấm dứt hợp đồng mua bán điện kèm Mã khách hàng trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Chọn ngày đề nghị chốt chỉ số công tơ cuối cùng.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Chấm dứt hợp đồng mua bán điện.',
      'Bước 2: Điện lực chốt chỉ số công tơ, khách hàng thanh toán tiền điện kỳ cuối và ký biên bản thanh lý điện tử.'
    ],
    importantNotes: 'Người thuê mặt bằng đứng tên hợp đồng điện nên chấm dứt hợp đồng trước khi bàn giao lại mặt bằng.'
  },
  {
    id: 'thay-doi-vi-tri-do-dem',
    tag: 'Di dời công tơ điện',
    title: 'Thay đổi vị trí thiết bị đo đếm',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Đăng ký di dời vị trí công tơ điện khi xây dựng, cải tạo nhà ở hoặc thay đổi kết cấu cổng, tường rào.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: 'Không quá 03 ngày làm việc',
    fee: 'Miễn phí khảo sát của ngành Điện',
    legalBasis: ['Luật Điện lực', 'Quy trình kinh doanh điện năng EVN'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn9-1', name: 'Yêu cầu thay đổi vị trí thiết bị đo đếm kèm Mã khách hàng trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Ghi rõ vị trí dự kiến di dời công tơ điện đến.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Thay đổi vị trí thiết bị đo đếm.',
      'Bước 2: Nhân viên Điện lực khảo sát, di dời công tơ sang vị trí mới an toàn và kẹp chì niêm phong.'
    ],
    importantNotes: 'Không tự ý tháo chì niêm phong công tơ điện khi chưa có nhân viên Điện lực thực hiện.'
  },
  {
    id: 'thay-doi-cong-suat-dien',
    tag: 'Đổi 1 pha <-> 3 pha',
    title: 'Thay đổi công suất sử dụng điện',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Đăng ký nâng hoặc hạ công suất sử dụng điện, chuyển đổi công tơ 1 pha sang 3 pha (hoặc ngược lại).',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: 'Không quá 03 ngày làm việc',
    fee: 'Miễn phí thay thế công tơ định mức của ngành Điện',
    legalBasis: ['Luật Điện lực', 'Thông tư 24/2016/TT-BCT'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn10-1', name: 'Yêu cầu thay đổi công suất sử dụng điện và bảng kê thiết bị trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Nêu rõ nhu cầu nâng công suất hoặc đổi lên điện 3 pha.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Thay đổi công suất sử dụng điện.',
      'Bước 2: Điện lực khảo sát, thay thế công tơ / aptomat phù hợp công suất mới.'
    ],
    importantNotes: 'Nên đăng ký nâng công suất khi lắp thêm thang máy, sạc xe điện hoặc máy móc 3 pha.'
  },
  {
    id: 'ngung-cap-dien',
    tag: 'Tạm cắt khi sửa nhà / Đi xa',
    title: 'Ngừng cấp điện theo yêu cầu',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Yêu cầu tạm ngừng cấp điện để phá dỡ, xây dựng sửa chữa nhà ở đảm bảo an toàn điện hoặc khi đi vắng dài ngày.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: 'Giải quyết trong 01 ngày làm việc (hoặc theo đúng giờ khách hàng yêu cầu)',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Thông tư 22/2020/TT-BCT của Bộ Công Thương'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn11-1', name: 'Yêu cầu ngừng cấp điện theo yêu cầu kèm Mã khách hàng trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Chọn ngày giờ bắt đầu tạm ngừng cấp điện.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Ngừng cấp điện theo yêu cầu.',
      'Bước 2: Điện lực chốt chỉ số công tơ và tạm cắt điện an toàn theo thời gian đăng ký.'
    ],
    importantNotes: 'Hợp đồng mua bán điện vẫn được bảo lưu để cấp điện trở lại ngay khi khách hàng yêu cầu.'
  },
  {
    id: 'cap-dien-tro-lai',
    tag: 'Đóng điện lại trong 24h',
    title: 'Cấp điện trở lại',
    isNew: true,
    category: 'dien-luc',
    categoryName: 'Dịch vụ công điện lực',
    summary: 'Yêu cầu đóng điện trở lại sau thời gian tạm ngừng cấp điện để sửa chữa nhà hoặc sau khi hoàn tất nghĩa vụ thanh toán.',
    agency: 'Tổng công ty Điện lực (EVN) qua ứng dụng VNeID',
    duration: 'Trong vòng 24 giờ kể từ khi nhận được yêu cầu hợp lệ',
    fee: 'Miễn phí nếu cấp điện trở lại sau khi tạm ngừng theo yêu cầu',
    legalBasis: ['Thông tư 22/2020/TT-BCT của Bộ Công Thương'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'evn12-1', name: 'Yêu cầu cấp điện trở lại kèm Mã khách hàng trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Đảm bảo hệ thống điện trong nhà đã an toàn trước khi đóng điện.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Dịch vụ công điện lực -> Cấp điện trở lại.',
      'Bước 2: Nhân viên Điện lực kiểm tra an toàn tại công tơ và đóng điện trở lại.'
    ],
    importantNotes: 'Kiểm tra kỹ cầu dao tổng trong nhà trước thời điểm nhân viên Điện lực đóng điện.'
  },

  // --- QUẢN LÝ XUẤT NHẬP CẢNH ---
  {
    id: 'cap-ho-chieu-pho-thong',
    tag: 'Hộ chiếu gắn chíp • Giao tận nhà',
    title: 'Cấp hộ chiếu phổ thông trong nước',
    isNew: true,
    category: 'xuat-nhap-canh',
    categoryName: 'Quản lý Xuất nhập cảnh',
    summary: 'Cấp hộ chiếu phổ thông (có gắn chíp điện tử hoặc không gắn chíp) lần đầu, cấp lại do hết hạn, hết trang, hư hỏng hoặc bị mất ngay trên VNeID.',
    agency: 'Phòng Quản lý xuất nhập cảnh Công an cấp tỉnh hoặc Cục Quản lý xuất nhập cảnh – Bộ Công an',
    duration: '05 - 08 ngày làm việc',
    fee: 'Cấp mới / hết hạn: 160.000đ/cuốn; Cấp lại do mất / hỏng: 320.000đ/cuốn (Đã giảm phí trực tuyến theo Thông tư 43/2024/TT-BTC)',
    legalBasis: [
      'Luật Xuất cảnh, nhập cảnh của công dân Việt Nam 2019 (sửa đổi năm 2023 bởi Luật số 23/2023/QH15)',
      'Thông tư 31/2023/TT-BCA của Bộ Công an',
      'Thông tư 43/2024/TT-BTC của Bộ Tài chính'
    ],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'hc-1', name: 'File ảnh chân dung cỡ 4x6cm nền trắng chuẩn ICAO (Chụp không quá 06 tháng)', type: 'Kê khai trực tuyến', quantity: '01 file ảnh .jpg', note: 'Mắt nhìn thẳng, lộ rõ hai vành tai, không đeo kính, mặc áo có cổ.' },
      { id: 'hc-2', name: 'Tờ khai đề nghị cấp hộ chiếu phổ thông trên ứng dụng VNeID', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Chọn loại "Hộ chiếu có gắn chíp điện tử" và chọn nhận hộ chiếu qua bưu điện.' },
      { id: 'hc-3', name: 'Hộ chiếu phổ thông cấp lần gần nhất (Nếu đã từng được cấp hộ chiếu)', type: 'Bản chính', quantity: '01 cuốn (nếu có)', note: 'Nộp lại qua bưu điện để đục lỗ hủy giá trị cuốn cũ; nếu bị mất thì kê khai báo mất trực tuyến.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Quản lý Xuất nhập cảnh -> Cấp hộ chiếu phổ thông trong nước.',
      'Bước 2: Tải lên ảnh chân dung 4x6 nền trắng, chọn Hộ chiếu gắn chíp điện tử và đăng ký nhận tại nhà.',
      'Bước 3: Thanh toán lệ phí trực tuyến (160.000đ) khi nhận được tin nhắn thông báo hồ sơ hợp lệ.',
      'Bước 4: Nhận Hộ chiếu mới tận nhà qua dịch vụ bưu chính công ích.'
    ],
    importantNotes: 'Ảnh chân dung 4x6 nền trắng là yếu tố quan trọng nhất: tuyệt đối không dùng ảnh selfie hoặc ảnh chỉnh sửa làm mờ vành tai.'
  },

  // --- KHÁC (XÁC NHẬN & ĐÁNH GIÁ DỊCH VỤ CÔNG TRÊN VNeID) ---
  {
    id: 'xac-nhan-tthc',
    tag: 'Dành cho Chủ hộ / Chủ nhà',
    title: 'Xác nhận thủ tục hành chính',
    isNew: false,
    category: 'khac-vneid',
    categoryName: 'Xác nhận & Đánh giá dịch vụ công',
    summary: 'Chức năng dành cho chủ hộ, chủ sở hữu chỗ ở hoặc cha mẹ bấm xác nhận đồng ý điện tử trên VNeID khi người thân/người thuê trọ nộp hồ sơ.',
    agency: 'Hệ thống Định danh và Xác thực điện tử (VNeID) – Bộ Công an',
    duration: 'Ghi nhận tức thì ngay khi bấm xác nhận',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Nghị định 69/2024/NĐ-CP về định danh điện tử', 'Thông tư 66/2023/TT-BCA'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'xntt-1', name: 'Tài khoản VNeID mức 2 của Chủ hộ / Chủ sở hữu chỗ ở hợp pháp', type: 'Tích hợp VNeID', quantity: '01 tài khoản', note: 'Mở mục Xác nhận thủ tục hành chính để duyệt yêu cầu đang chờ.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Khác -> Chọn "Xác nhận thủ tục hành chính".',
      'Bước 2: Xem nội dung hồ sơ cần xác nhận, bấm "Đồng ý" và nhập Passcode / Vân tay để ký số.'
    ],
    importantNotes: 'Thay thế hoàn toàn việc chủ hộ phải ký trực tiếp bằng bút mực lên Tờ khai giấy.'
  },
  {
    id: 'danh-gia-dich-vu-tthc',
    tag: 'Phản hồi sau giải quyết',
    title: 'Đánh giá dịch vụ TTHC',
    isNew: false,
    category: 'khac-vneid',
    categoryName: 'Xác nhận & Đánh giá dịch vụ công',
    summary: 'Đánh giá mức độ hài lòng về kết quả và thời gian xử lý hồ sơ thủ tục hành chính công dân đã thực hiện.',
    agency: 'Cổng Dịch vụ công Quốc gia & Ứng dụng VNeID',
    duration: 'Ghi nhận trực tuyến tức thì',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Quyết định 766/QĐ-TTg của Thủ tướng Chính phủ'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'dg1-1', name: 'Hồ sơ thủ tục hành chính đã được giải quyết trên VNeID', type: 'Kê khai trực tuyến', quantity: '01 hồ sơ', note: 'Chọn từ danh sách lịch sử hồ sơ trên ứng dụng.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Khác -> Đánh giá dịch vụ TTHC.',
      'Bước 2: Chọn mức độ hài lòng và gửi đánh giá.'
    ],
    importantNotes: 'Góp phần nâng cao chất lượng phục vụ người dân tại các cơ quan hành chính.'
  },
  {
    id: 'danh-gia-cchc-cand',
    tag: 'Khảo sát trực tuyến 1 phút',
    title: 'Đánh giá cải cách hành chính trong CAND',
    isNew: false,
    category: 'khac-vneid',
    categoryName: 'Xác nhận & Đánh giá dịch vụ công',
    summary: 'Khảo sát sự hài lòng của người dân đối với công tác giải quyết thủ tục hành chính của lực lượng Công an nhân dân.',
    agency: 'Bộ Công an (Trên ứng dụng VNeID)',
    duration: 'Hoàn thành trong 01 phút',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Chương trình cải cách hành chính nhà nước trong Công an nhân dân'],
    portalUrl: 'https://dichvucong.bocongan.gov.vn',
    checklist: [
      { id: 'dg2-1', name: 'Tài khoản định danh điện tử VNeID', type: 'Tích hợp VNeID', quantity: '01 tài khoản', note: 'Điền phiếu khảo sát trực tuyến trên ứng dụng.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Khác -> Đánh giá cải cách hành chính trong CAND.',
      'Bước 2: Chọn đơn vị Công an đã giao dịch và gửi phiếu khảo sát.'
    ],
    importantNotes: 'Thông tin đánh giá của người dân được bảo mật tuyệt đối.'
  },
  {
    id: 'danh-gia-cung-ung-dvhcc',
    tag: 'Chấm điểm chất lượng phục vụ',
    title: 'Đánh giá việc cung ứng dịch vụ hành chính công',
    isNew: true,
    category: 'khac-vneid',
    categoryName: 'Xác nhận & Đánh giá dịch vụ công',
    summary: 'Chức năng mới trên VNeID giúp người dân chấm điểm chất lượng cung ứng dịch vụ hành chính công tại các Bộ, ngành, địa phương.',
    agency: 'Văn phòng Chính phủ & Bộ Công an (Trên ứng dụng VNeID)',
    duration: 'Ghi nhận trực tuyến tức thì',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Nghị định 61/2018/NĐ-CP và Nghị định 107/2021/NĐ-CP'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'dg3-1', name: 'Thông tin cơ quan giải quyết hoặc hồ sơ dịch vụ hành chính công', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Chấm điểm theo các tiêu chí công khai trên VNeID.' }
    ],
    steps: [
      'Bước 1: Mở VNeID -> Thủ tục hành chính -> Khác -> Đánh giá việc cung ứng dịch vụ hành chính công.',
      'Bước 2: Đánh giá theo thang điểm sao và gửi ý kiến.'
    ],
    importantNotes: 'Dữ liệu được đồng bộ trực tiếp về Cổng Dịch vụ công Quốc gia.'
  },

  // --- HỘ TỊCH, ĐẤT ĐAI & VIỆC LÀM ---
  {
    id: 'dang-ky-ket-hon',
    tag: 'Miễn phí • Giải quyết trong ngày',
    title: 'Đăng ký kết hôn & Xác nhận tình trạng hôn nhân',
    isNew: false,
    category: 'dan-su-mo-rong',
    categoryName: 'Hộ tịch, Đất đai & Việc làm',
    summary: 'Thủ tục đăng ký kết hôn tại UBND cấp xã hoặc xin cấp Giấy xác nhận tình trạng hôn nhân (độc thân) để kết hôn, mua bán nhà đất.',
    agency: 'UBND xã, phường, thị trấn nơi cư trú (Qua Cổng Dịch vụ công Quốc gia)',
    duration: 'Ngay trong ngày (Kết hôn) hoặc 03 ngày làm việc (Xác nhận tình trạng hôn nhân)',
    fee: 'Miễn phí đăng ký kết hôn trong nước; Xác nhận tình trạng hôn nhân: 10.000đ - 15.000đ',
    legalBasis: ['Luật Hôn nhân và gia đình 2014', 'Luật Hộ tịch 2014', 'Nghị định 123/2015/NĐ-CP'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'kh-1', name: 'Tờ khai đăng ký kết hôn / Tờ khai xác nhận tình trạng hôn nhân', type: 'Kê khai trực tuyến', quantity: '01 bản', note: 'Điền trực tuyến trên Cổng Dịch vụ công Quốc gia.' },
      { id: 'kh-2', name: 'Thẻ Căn cước hoặc VNeID mức 2 của hai bên nam, nữ', type: 'Tích hợp VNeID', quantity: '02 thẻ', note: 'Hai bên xuất trình khi trực tiếp đến UBND xã ký Giấy chứng nhận kết hôn.' },
      { id: 'kh-3', name: 'Bản án / Quyết định ly hôn có hiệu lực (Nếu đã từng ly hôn)', type: 'Bản sao / Ảnh chụp', quantity: '01 bản (nếu có)', note: 'Miễn nộp giấy xác nhận độc thân bản giấy nếu dữ liệu đã có trên CSDL dân cư.' }
    ],
    steps: [
      'Bước 1: Nộp tờ khai trực tuyến trên Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn).',
      'Bước 2: Công chức Tư pháp - Hộ tịch kiểm tra thông tin tình trạng hôn nhân trên CSDL quốc gia.',
      'Bước 3: Hai bên nam, nữ có mặt trực tiếp tại UBND cấp xã để ký Sổ hộ tịch và nhận Giấy chứng nhận kết hôn.'
    ],
    importantNotes: 'Khi nhận Giấy chứng nhận kết hôn, bắt buộc cả hai bên nam và nữ phải có mặt trực tiếp.'
  },
  {
    id: 'dang-ky-bien-dong-dat-dai',
    tag: 'Theo Luật Đất đai 2024',
    title: 'Đăng ký biến động đất đai (Sang tên Sổ đỏ)',
    isNew: true,
    category: 'dan-su-mo-rong',
    categoryName: 'Hộ tịch, Đất đai & Việc làm',
    summary: 'Sang tên Giấy chứng nhận quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất khi chuyển nhượng, tặng cho, thừa kế.',
    agency: 'Chi nhánh Văn phòng đăng ký đất đai hoặc Bộ phận Một cửa cấp huyện',
    duration: 'Không quá 10 ngày làm việc kể từ ngày nhận đủ hồ sơ hợp lệ',
    fee: 'Thuế TNCN 2% và Lệ phí trước bạ 0.5% (Miễn thuế và lệ phí trước bạ nếu tặng cho giữa cha mẹ - con, vợ - chồng)',
    legalBasis: ['Điều 133 Luật Đất đai 2024 (Số 31/2024/QH15)', 'Nghị định 101/2024/NĐ-CP'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'dd-1', name: 'Đơn đăng ký biến động đất đai, tài sản gắn liền với đất (Mẫu 11/ĐK)', type: 'Kê khai trực tuyến', quantity: '01 bản', note: 'Ghi rõ yêu cầu xác nhận trên sổ cũ hoặc cấp đổi phôi Sổ đỏ mẫu mới.' },
      { id: 'dd-2', name: 'Hợp đồng chuyển nhượng / tặng cho quyền sử dụng đất có công chứng', type: 'Bản chính', quantity: '02 bản', note: 'Lập tại Văn phòng công chứng hoặc UBND cấp xã nơi có đất.' },
      { id: 'dd-3', name: 'Bản gốc Giấy chứng nhận (Sổ đỏ / Sổ hồng) đã cấp', type: 'Bản chính', quantity: '01 bản gốc', note: 'Nộp bản gốc tại Bộ phận Một cửa.' },
      { id: 'dd-4', name: 'Tờ khai thuế thu nhập cá nhân và Tờ khai lệ phí trước bạ nhà, đất', type: 'Kê khai trực tuyến', quantity: '01 bộ', note: 'Kèm giấy tờ chứng minh quan hệ nhân thân nếu thuộc diện miễn thuế.' }
    ],
    steps: [
      'Bước 1: Hai bên ký Hợp đồng chuyển nhượng / tặng cho tại Phòng công chứng.',
      'Bước 2: Nộp hồ sơ đăng ký biến động tại Bộ phận Một cửa cấp huyện trong vòng 30 ngày.',
      'Bước 3: Thực hiện nghĩa vụ thuế trực tuyến theo Thông báo của cơ quan Thuế và nhận Sổ đỏ đã sang tên.'
    ],
    importantNotes: 'Phải nộp hồ sơ đăng ký biến động trong vòng 30 ngày kể từ ngày công chứng hợp đồng để tránh bị phạt chậm sang tên.'
  },
  {
    id: 'dang-ky-ho-kinh-doanh',
    tag: 'Cấp kèm Mã số thuế • 3 ngày',
    title: 'Đăng ký thành lập Hộ kinh doanh cá thể',
    isNew: false,
    category: 'dan-su-mo-rong',
    categoryName: 'Hộ tịch, Đất đai & Việc làm',
    summary: 'Đăng ký cấp Giấy chứng nhận hộ kinh doanh cá thể và mã số thuế khi mở cửa hàng, quán ăn, dịch vụ thương mại.',
    agency: 'Phòng Tài chính - Kế hoạch thuộc UBND cấp huyện hoặc Cổng DVC cấp tỉnh',
    duration: '03 ngày làm việc',
    fee: 'Khoảng 100.000đ/lần',
    legalBasis: ['Nghị định 01/2021/NĐ-CP', 'Thông tư 02/2023/TT-BKHĐT'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'hkd-1', name: 'Giấy đề nghị đăng ký hộ kinh doanh', type: 'Kê khai trực tuyến', quantity: '01 bản', note: 'Ghi rõ Tên hộ kinh doanh, địa chỉ cửa hàng, ngành nghề và số vốn.' },
      { id: 'hkd-2', name: 'Thẻ Căn cước / VNeID của chủ hộ kinh doanh', type: 'Tích hợp VNeID', quantity: '01 bản', note: 'Hệ thống tự động đối chiếu dữ liệu dân cư.' }
    ],
    steps: [
      'Bước 1: Nộp hồ sơ trực tuyến trên Cổng dịch vụ công hoặc tại Bộ phận Một cửa cấp huyện.',
      'Bước 2: Nhận Giấy chứng nhận đăng ký hộ kinh doanh kiêm Mã số thuế trong 03 ngày làm việc.'
    ],
    importantNotes: 'Mỗi công dân chỉ được đứng tên làm chủ 01 hộ kinh doanh duy nhất trên toàn quốc.'
  },
  {
    id: 'tro-cap-that-nghiep',
    tag: 'Nhận trợ cấp qua thẻ ngân hàng',
    title: 'Đề nghị hưởng Trợ cấp thất nghiệp',
    isNew: false,
    category: 'dan-su-mo-rong',
    categoryName: 'Hộ tịch, Đất đai & Việc làm',
    summary: 'Nộp hồ sơ trực tuyến hưởng trợ cấp thất nghiệp hàng tháng và nhận thẻ BHYT miễn phí cho người lao động sau khi nghỉ việc.',
    agency: 'Cổng Dịch vụ công Quốc gia (dichvucong.gov.vn) hoặc Trung tâm Dịch vụ việc làm',
    duration: '15 - 20 ngày làm việc (Hạn nộp trong vòng 03 tháng kể từ ngày nghỉ việc)',
    fee: 'Miễn phí (0 đồng)',
    legalBasis: ['Luật Việc làm 2013', 'Nghị định 61/2020/NĐ-CP', 'Thông tư 15/2023/TT-BLĐTBXH'],
    portalUrl: 'https://dichvucong.gov.vn',
    checklist: [
      { id: 'tctn-1', name: 'Đề nghị hưởng trợ cấp thất nghiệp trực tuyến', type: 'Kê khai trực tuyến', quantity: '01 biểu mẫu', note: 'Điền chính xác số tài khoản ngân hàng chính chủ.' },
      { id: 'tctn-2', name: 'Quyết định thôi việc / Chấm dứt hợp đồng lao động', type: 'Bản sao / Ảnh chụp', quantity: '01 bản chụp', note: 'Nộp trong thời hạn 03 tháng kể từ ngày chấm dứt HĐLĐ.' },
      { id: 'tctn-3', name: 'Sổ Bảo hiểm xã hội đã được cơ quan BHXH xác nhận chốt sổ', type: 'Bản chính', quantity: '01 cuốn (hoặc dữ liệu VssID)', note: 'Đảm bảo công ty cũ đã hoàn tất chốt sổ BHXH.' }
    ],
    steps: [
      'Bước 1: Đăng nhập Cổng Dịch vụ công Quốc gia bằng VNeID -> Giải quyết hưởng trợ cấp thất nghiệp.',
      'Bước 2: Đính kèm bản chụp Quyết định thôi việc và gửi hồ sơ.',
      'Bước 3: Nhận tiền trợ cấp thất nghiệp hàng tháng qua tài khoản ngân hàng.'
    ],
    importantNotes: 'Mức hưởng bằng 60% bình quân tiền lương tháng đóng BHTN của 06 tháng liền kề trước khi nghỉ việc.'
  }
];

// ==========================================
// 4. HÀM SINH TRƯỜNG HỢP ÁP DỤNG (BƯỚC 2)
// ==========================================
function getProcedureScenarios(proc: Procedure): ScenarioOption[] {
  if (proc.customScenarios) return proc.customScenarios;

  switch (proc.category) {
    case 'can-cuoc':
      return [
        {
          id: 'age-renewal',
          label: 'Cấp đổi theo độ tuổi (14, 25, 40, 60 tuổi)',
          badge: 'Miễn lệ phí 100%',
          description: 'Dành cho công dân đến mốc tuổi đổi thẻ định kỳ theo Điều 21 Luật Căn cước 2023.',
          rejectionWarning: 'Cần mang theo thẻ CCCD cũ để nộp lại khi nhận thẻ mới; không mặc áo trắng trùng phông nền khi đi chụp ảnh thu nhận sinh trắc học.'
        },
        {
          id: 'under-14',
          label: 'Làm thẻ lần đầu cho trẻ dưới 14 tuổi (0 - 6 tuổi & 6 - 14 tuổi)',
          badge: 'Cha mẹ đăng ký trên VNeID',
          description: 'Trẻ dưới 6 tuổi làm hoàn toàn trên VNeID (không cần chụp ảnh/vân tay); trẻ từ 6 - 14 tuổi cha mẹ đưa đến điểm thu nhận.',
          extraRequirement: {
            id: `${proc.id}-extra-u14`,
            name: 'Tài khoản VNeID mức 2 của Cha hoặc Mẹ (Người đại diện hợp pháp)',
            type: 'Tích hợp VNeID',
            quantity: '01 tài khoản',
            note: 'Cha hoặc mẹ đăng nhập VNeID của mình để chọn mục "Kê khai cấp Căn cước cho người dưới 14 tuổi".'
          },
          rejectionWarning: 'Nếu thông tin quan hệ Cha/Mẹ - Con chưa đồng bộ trên VNeID thì cần mang theo Giấy khai sinh của bé để đối chiếu.'
        },
        {
          id: 'lost-damaged',
          label: 'Cấp lại do bị mất hoặc hư hỏng thẻ Căn cước',
          badge: 'Làm trực tuyến trên VNeID',
          description: 'Sử dụng lại ảnh khuôn mặt, vân tay, mống mắt đã thu nhận trước đó để cấp lại thẻ trực tuyến.',
          rejectionWarning: 'Cần thanh toán lệ phí trực tuyến ngay khi hệ thống gửi thông báo tiếp nhận để hồ sơ không bị hủy tự động.'
        }
      ];

    case 'cu-tru':
      return [
        {
          id: 'rent-house',
          label: 'Người thuê nhà trọ / Thuê căn hộ chung cư',
          badge: 'Phổ biến nhất',
          description: 'Dành cho sinh viên, người lao động thuê nhà trọ hoặc thuê căn hộ có hợp đồng thuê.',
          extraRequirement: {
            id: `${proc.id}-extra-rent`,
            name: 'Xác nhận đồng ý của Chủ sở hữu nhà cho thuê trên VNeID',
            type: 'Tích hợp VNeID',
            quantity: '01 xác nhận điện tử',
            note: 'Nhập đúng họ tên và số Căn cước của chủ nhà trọ để hệ thống gửi thông báo xác nhận về máy chủ nhà.'
          },
          rejectionWarning: 'Hồ sơ hay bị trả về do chủ nhà trọ quên mở ứng dụng VNeID bấm "Xác nhận đồng ý" hoặc ảnh chụp hợp đồng thuê nhà bị thiếu trang chữ ký.'
        },
        {
          id: 'relative-house',
          label: 'Nhập vào hộ gia đình người thân / Ở nhờ nhà người quen',
          badge: 'Cần chủ hộ xác nhận',
          description: 'Dành cho vợ/chồng, con cái, anh chị em hoặc người thân chuyển về ở cùng hộ gia đình đã có sẵn.',
          rejectionWarning: 'Cần chọn đúng mối quan hệ với chủ hộ trên biểu mẫu điện tử và nhắc chủ hộ bấm xác nhận đồng ý trên VNeID.'
        },
        {
          id: 'owner-house',
          label: 'Chỗ ở thuộc quyền sở hữu chính chủ của người đăng ký',
          badge: 'Chính chủ nhà đất',
          description: 'Người đi đăng ký đứng tên trực tiếp trên Sổ đỏ / Sổ hồng hoặc Hợp đồng mua bán nhà ở.',
          rejectionWarning: 'Khi tải ảnh Sổ đỏ lên ứng dụng, cần chụp đủ cả trang bìa, trang thông tin thửa đất và trang ghi nhận biến động sang tên.'
        }
      ];

    case 'phuong-tien':
      return [
        {
          id: 'new-vehicle-vneid',
          label: 'Xe mới lắp ráp trong nước (Bấm biển số trên VNeID)',
          badge: 'Không cần mang xe đi khám',
          description: 'Thực hiện bấm biển số định danh ngay trên điện thoại và nhận biển số tại nhà qua bưu điện.',
          rejectionWarning: 'Ảnh chụp đầu xe phải đúng góc 45 độ nhìn rõ kiểu dáng xe và phải hoàn tất nộp thuế trước bạ điện tử trước khi kê khai.'
        },
        {
          id: 'transfer-same-province',
          label: 'Mua bán, sang tên xe cũ (Cùng tỉnh / thành phố)',
          badge: 'Thu hồi biển định danh',
          description: 'Chủ cũ làm thủ tục thu hồi biển số định danh, chủ mới đăng ký cấp biển định danh mới.',
          rejectionWarning: 'Quá 30 ngày kể từ ngày công chứng hợp đồng mua bán mới đi làm thủ tục thu hồi biển số sẽ bị phạt chậm sang tên.'
        },
        {
          id: 'transfer-diff-province',
          label: 'Mua bán xe cũ khác tỉnh / Đổi bằng lái trực tuyến',
          badge: 'Nộp qua Cổng DVC',
          description: 'Thực hiện thu hồi tại nơi quản lý hồ sơ xe cũ và đăng ký mới tại Công an nơi chủ mới cư trú.',
          rejectionWarning: 'Cần chuẩn bị sẵn bản cà số khung, số máy; nếu đổi bằng lái thì ảnh chân dung nền xanh không được đeo kính.'
        }
      ];

    case 'dien-luc':
      return [
        {
          id: 'evn-household',
          label: 'Hộ gia đình sử dụng điện sinh hoạt',
          badge: 'Xác thực qua VNeID',
          description: 'Dành cho hộ gia đình đăng ký lắp mới, thay đổi thông tin, công suất hoặc định mức điện sinh hoạt.',
          rejectionWarning: 'Cần nhập chính xác Mã khách hàng (bắt đầu bằng PE/PA/PB/PC/PD...) in trên hóa đơn tiền điện hàng tháng.'
        },
        {
          id: 'evn-landlord',
          label: 'Chủ nhà trọ / Người thuê trọ đăng ký định mức điện',
          badge: 'Hưởng giá điện bậc thang',
          description: 'Đăng ký định mức điện sinh hoạt theo số lượng người thuê trọ thực tế (4 người = 1 hộ định mức).',
          extraRequirement: {
            id: `${proc.id}-extra-tenant`,
            name: 'Xác nhận đăng ký tạm trú trên VNeID của những người thuê trọ',
            type: 'Tích hợp VNeID',
            quantity: 'Theo danh sách người thuê',
            note: 'Dùng để Điện lực cấp định mức bậc thang giá điện sinh hoạt.'
          },
          rejectionWarning: 'Người thuê trọ cần hoàn tất đăng ký tạm trú trên VNeID và có hợp đồng thuê nhà còn hiệu lực.'
        },
        {
          id: 'evn-business',
          label: 'Hộ kinh doanh, cửa hàng, doanh nghiệp',
          badge: 'Điện kinh doanh / 3 pha',
          description: 'Dành cho cửa hàng thương mại, dịch vụ, xưởng sản xuất đăng ký cấp điện hoặc đổi mục đích.',
          rejectionWarning: 'Cần đính kèm ảnh chụp Giấy chứng nhận đăng ký hộ kinh doanh hoặc đăng ký doanh nghiệp tại địa điểm mua điện.'
        }
      ];

    default:
      return [
        {
          id: 'online-vneid',
          label: 'Nộp trực tuyến toàn trình trên VNeID / Cổng Dịch vụ công',
          badge: 'Nhanh nhất • Giảm lệ phí',
          description: 'Nộp hồ sơ điện tử bằng tài khoản VNeID mức độ 2 và nhận kết quả điện tử + bưu chính tại nhà.',
          rejectionWarning: 'Ảnh chụp giấy tờ đính kèm phải rõ nét đủ 4 góc, không bị lóa sáng và dung lượng file nằm trong giới hạn cho phép.'
        },
        {
          id: 'in-person-support',
          label: 'Nộp trực tiếp tại Bộ phận Một cửa (Đã chuẩn bị trước hồ sơ)',
          badge: 'Cần đối chiếu bản gốc',
          description: 'Chuẩn bị sẵn toàn bộ giấy tờ theo danh sách bên dưới và mang bản chính đến Bộ phận Một cửa để đối chiếu.',
          rejectionWarning: 'Nên đặt lịch hẹn trước và mang theo cả bản chính lẫn bản sao chứng thực để không phải đi photo lại.'
        },
        {
          id: 'authorized-rep',
          label: 'Làm thay cho người thân / Người được ủy quyền',
          badge: 'Kê khai hộ',
          description: 'Dành cho trường hợp làm thủ tục cho con nhỏ, cha mẹ cao tuổi hoặc theo văn bản ủy quyền hợp pháp.',
          extraRequirement: {
            id: `${proc.id}-extra-auth`,
            name: 'Văn bản ủy quyền hợp pháp hoặc Giấy tờ chứng minh quan hệ đại diện (Cha mẹ/Người giám hộ)',
            type: 'Bản chính',
            quantity: '01 bản',
            note: 'Lưu ý: Riêng thủ tục Đăng ký kết hôn bắt buộc hai bên phải có mặt, không được ủy quyền.'
          },
          rejectionWarning: 'Văn bản ủy quyền cần được chứng thực hợp lệ tại UBND cấp xã hoặc Văn phòng công chứng.'
        }
      ];
  }
}

// ==========================================
// 5. DANH SÁCH NGUỒN THAM KHẢO CHÍNH THỐNG
// ==========================================
const REFERENCE_SOURCES: ReferenceSource[] = [
  {
    id: 'ref-1',
    title: 'Ứng dụng Định danh điện tử Quốc gia (VNeID) – Bộ Công an',
    agency: 'Trung tâm Dữ liệu quốc gia về dân cư - Bộ Công an',
    type: 'Nền tảng số Quốc gia',
    description: 'Cung cấp trực tiếp các nhóm thủ tục hành chính về Cư trú, Căn cước, Tư pháp, Đăng ký xe lần đầu, Liên thông khai sinh - khai tử, Điện lực và Xuất nhập cảnh.',
    url: 'https://vneid.gov.vn'
  },
  {
    id: 'ref-2',
    title: 'Cổng Dịch vụ công Quốc gia',
    agency: 'Văn phòng Chính phủ',
    type: 'Cổng dịch vụ công',
    description: 'Cổng dịch vụ công một cửa quốc gia tích hợp các thủ tục liên thông hành chính, hộ tịch, đất đai, bảo hiểm thất nghiệp và dịch vụ điện lực.',
    url: 'https://dichvucong.gov.vn'
  },
  {
    id: 'ref-3',
    title: 'Cổng Dịch vụ công Bộ Công an',
    agency: 'Bộ Công an',
    type: 'Cổng dịch vụ công',
    description: 'Giải quyết các thủ tục đăng ký thường trú, tạm trú, lưu trú, tạm vắng, cấp thẻ Căn cước, cấp hộ chiếu phổ thông và đăng ký phương tiện giao thông.',
    url: 'https://dichvucong.bocongan.gov.vn'
  },
  {
    id: 'ref-4',
    title: 'Cơ sở dữ liệu Quốc gia về Thủ tục hành chính',
    agency: 'Cục Kiểm soát thủ tục hành chính - Văn phòng Chính phủ',
    type: 'Cơ sở dữ liệu luật',
    description: 'Nguồn dữ liệu gốc công bố chính thức thành phần hồ sơ, trình tự thực hiện, thời hạn giải quyết và lệ phí của các thủ tục hành chính.',
    url: 'https://csdl.dichvucong.gov.vn'
  },
  {
    id: 'ref-5',
    title: 'Cơ sở dữ liệu Quốc gia về Văn bản pháp luật',
    agency: 'Bộ Tư pháp',
    type: 'Cơ sở dữ liệu luật',
    description: 'Tra cứu toàn văn Luật Căn cước 2023, Luật Cư trú 2020, Luật Đất đai 2024, Luật Trật tự ATGT đường bộ 2024, Luật Xuất nhập cảnh sửa đổi 2023 và Nghị định 63/2024/NĐ-CP.',
    url: 'https://vbpl.vn'
  },
  {
    id: 'ref-6',
    title: 'Cổng Thông tin Dịch vụ Điện lực – Tập đoàn Điện lực Việt Nam (EVN)',
    agency: 'Tập đoàn Điện lực Việt Nam (EVN)',
    type: 'Dịch vụ công Điện lực',
    description: 'Quy trình chuẩn cho nhóm dịch vụ công ngành điện: Cấp điện mới hạ áp/trung áp, thay đổi chủ thể, mục đích, định mức, công suất, vị trí đo đếm, gia hạn/chấm dứt hợp đồng điện.',
    url: 'https://www.evn.com.vn'
  },
  {
    id: 'ref-7',
    title: 'Cổng Thông tin điện tử về Xuất nhập cảnh Việt Nam',
    agency: 'Cục Quản lý xuất nhập cảnh - Bộ Công an',
    type: 'Dịch vụ công XNC',
    description: 'Hướng dẫn quy chuẩn ảnh chân dung 4x6 và thủ tục cấp hộ chiếu phổ thông có gắn chíp điện tử trong nước qua VNeID.',
    url: 'https://hochieu.xuatnhapcanh.gov.vn'
  },
  {
    id: 'ref-8',
    title: 'Trang Thông tin điện tử Đổi Giấy phép lái xe',
    agency: 'Cục Đường bộ Việt Nam',
    type: 'Dịch vụ công Giao thông',
    description: 'Hệ thống dịch vụ công trực tuyến toàn trình cấp độ 4 đổi Giấy phép lái xe trên toàn quốc.',
    url: 'https://dvc4.gplx.gov.vn'
  },
  {
    id: 'ref-9',
    title: 'Cổng Thông tin điện tử Bảo hiểm xã hội Việt Nam',
    agency: 'Bảo hiểm xã hội Việt Nam',
    type: 'Cổng dịch vụ công',
    description: 'Hướng dẫn liên thông cấp thẻ BHYT cho trẻ dưới 6 tuổi, giải quyết mai táng phí, tử tuất và trợ cấp thất nghiệp.',
    url: 'https://baohiemxahoi.gov.vn'
  }
];

const QUICK_REPLIES = [
  {
    label: '🛂 Làm hộ chiếu gắn chíp trên VNeID',
    prompt: 'Tôi muốn làm hộ chiếu phổ thông gắn chíp trực tuyến trên ứng dụng VNeID thì cần chuẩn bị ảnh thế nào, lệ phí bao nhiêu và bao lâu nhận được?'
  },
  {
    label: '👶 Mới sinh con làm liên thông 4 thủ tục',
    prompt: 'Vợ chồng tôi mới sinh con, muốn làm thủ tục liên thông Khai sinh, đăng ký thường trú, cấp thẻ Căn cước và thẻ BHYT trên VNeID thì cần giấy tờ gì?'
  },
  {
    label: '🏠 Thuê trọ đăng ký tạm trú & định mức điện',
    prompt: 'Tôi đi thuê nhà trọ, muốn đăng ký tạm trú trên VNeID và đăng ký định mức điện sinh hoạt cho người thuê trọ thì cần làm thế nào?'
  },
  {
    label: '🛵 Mua xe mới bấm biển số trên VNeID',
    prompt: 'Tôi mới mua xe lắp ráp trong nước, muốn tự đăng ký xe lần đầu và bấm biển số trên ứng dụng VNeID thì cần chuẩn bị những gì?'
  },
  {
    label: '🪪 Đổi thẻ Căn cước khi đủ 25 tuổi',
    prompt: 'Thẻ căn cước của tôi sắp đến mốc 25 tuổi thì thủ tục cấp đổi thẻ Căn cước mới trên VNeID như thế nào và có mất phí không?'
  }
];

// ==========================================
// 5.5 TIỆN ÍCH TÌM KIẾM TIẾNG VIỆT KHÔNG DẤU & FALLBACK CHATBOT
// ==========================================
function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function findBestMatchingProcedure(question: string): Procedure | undefined {
  const qClean = removeAccents(question);
  let bestProc: Procedure | undefined;
  let maxScore = 0;

  for (const proc of PROCEDURES) {
    let score = 0;
    const titleClean = removeAccents(proc.title);
    const summaryClean = removeAccents(proc.summary);
    const catClean = removeAccents(proc.categoryName);

    // Khớp nguyên tiêu đề hoặc chuỗi con
    if (qClean.includes(titleClean) || titleClean.includes(qClean)) {
      score += 60;
    }

    const titleWords = titleClean.split(/[\s,.-]+/).filter((w) => w.length >= 3);
    for (const w of titleWords) {
      if (qClean.includes(w)) score += 12;
    }

    const summaryWords = summaryClean.split(/[\s,.-]+/).filter((w) => w.length >= 4);
    for (const w of summaryWords) {
      if (qClean.includes(w)) score += 3;
    }

    if (qClean.includes(catClean)) score += 15;

    // Từ khóa chuyên ngành phổ biến
    if (qClean.includes('tam tru') && (proc.id.includes('tam-tru') || titleClean.includes('tam tru'))) score += 40;
    if (qClean.includes('thuong tru') && (proc.id.includes('thuong-tru') || titleClean.includes('thuong tru'))) score += 40;
    if (qClean.includes('luu tru') && (proc.id.includes('luu-tru') || titleClean.includes('luu tru'))) score += 40;
    if (qClean.includes('ho chieu') && (proc.id.includes('ho-chieu') || titleClean.includes('ho chieu'))) score += 40;
    if (qClean.includes('can cuoc') && (proc.id.includes('can-cuoc') || titleClean.includes('can cuoc'))) score += 40;
    if ((qClean.includes('xe') || qClean.includes('sang ten')) && (proc.id.includes('xe') || titleClean.includes('xe'))) score += 40;
    if ((qClean.includes('khai sinh') || qClean.includes('lien thong')) && (proc.id.includes('khai-sinh') || titleClean.includes('khai sinh'))) score += 40;
    if ((qClean.includes('dien') || qClean.includes('cong to') || qClean.includes('evn')) && (proc.id.includes('dien') || titleClean.includes('dien'))) score += 40;
    if ((qClean.includes('ly lich') || qClean.includes('an tich')) && (proc.id.includes('ly-lich') || titleClean.includes('ly lich'))) score += 40;
    if ((qClean.includes('ket hon') || qClean.includes('ly hon')) && titleClean.includes('ket hon')) score += 40;

    if (score > maxScore) {
      maxScore = score;
      bestProc = proc;
    }
  }

  return maxScore >= 12 ? bestProc : undefined;
}

function buildFallbackResponse(question: string): { text: string; procId?: string } {
  const matchedProc = findBestMatchingProcedure(question);
  if (matchedProc) {
    const text = `🎯 **Thủ tục cần làm:** ${matchedProc.title} (${matchedProc.tag})
Tóm tắt quy định: ${matchedProc.summary}

📋 **Giấy tờ cần chuẩn bị:**
${matchedProc.checklist.map((c, i) => `• Giấy tờ ${i + 1}: ${c.name} (${c.type} - ${c.quantity})\n  → Lưu ý: ${c.note}`).join('\n')}

🏛️ **Cơ quan & Thời hạn:**
• Cơ quan tiếp nhận & giải quyết: ${matchedProc.agency}
• Thời hạn giải quyết: ${matchedProc.duration}
• Lệ phí nhà nước: ${matchedProc.fee}

⚖️ **Căn cứ pháp lý + Lưu ý:**
• Căn cứ pháp lý: ${matchedProc.legalBasis.join('; ')}
• Các bước thực hiện: ${matchedProc.steps.join(' ➔ ')}
• Lưu ý quan trọng để không bị trả hồ sơ: ${matchedProc.importantNotes || 'Cần kiểm tra kỹ các thông tin trích xuất tự động và chụp đính kèm giấy tờ rõ cả 4 góc.'}`;
    return { text, procId: matchedProc.id };
  }

  const text = `🎯 **Thủ tục cần làm:** Hướng dẫn tra cứu và chuẩn bị hồ sơ Dịch vụ công & VNeID

📋 **Giấy tờ cần chuẩn bị:**
• Tài khoản định danh điện tử VNeID mức độ 2 đã kích hoạt
• Bản chụp / scan rõ nét 4 góc các giấy tờ chứng minh thông tin liên quan (dưới 5MB, định dạng PDF/JPG/PNG)

🏛️ **Cơ quan & Thời hạn:**
• Nơi tiếp nhận & xử lý: Cơ quan có thẩm quyền theo quy định từng thủ tục hành chính
• Cổng nộp hồ sơ trực tuyến: Cổng Dịch vụ công Quốc gia (https://dichvucong.gov.vn) hoặc ứng dụng VNeID

⚖️ **Căn cứ pháp lý + Lưu ý:**
• Bạn vui lòng truy cập Cổng Dịch vụ công Quốc gia (https://dichvucong.gov.vn) hoặc danh mục "Tra cứu thủ tục" trong ứng dụng này để chọn đúng hồ sơ cần làm.
• Bạn có thể nhấn vào các câu hỏi gợi ý nhanh bên dưới hoặc gõ rõ tên thủ tục (như Tạm trú, Hộ chiếu, Căn cước, Khai sinh, Sang tên xe...) để nhận danh mục giấy tờ chi tiết ngay lập tức!`;
  return { text, procId: undefined };
}

// ==========================================
// 6. COMPONENT CHÍNH (APP)
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState<'lookup' | 'detail' | 'assistant' | 'references' | 'about'>('lookup');
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>(PROCEDURES[1].id);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');

  // Hướng dẫn điền tờ khai điện tử VNeID Modal
  const [isVneidGuideOpen, setIsVneidGuideOpen] = useState<boolean>(false);

  // Chế độ hiển thị & Ngôn ngữ
  const [viewMode, setViewMode] = useState<'vneid-grid' | 'detailed-cards'>('vneid-grid');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [onlyPreparingFilter, setOnlyPreparingFilter] = useState<boolean>(false);

  // Tìm kiếm & lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [refSearchQuery, setRefSearchQuery] = useState('');

  // Trạng thái 3 mức của từng giấy tờ ('none' | 'paper' | 'vneid')
  const [docStates, setDocStates] = useState<Record<string, DocReadyState>>(() => {
    try {
      const saved = localStorage.getItem('f03_doc_states_v4');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('f03_notes_v4');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Lịch sử Chatbot kiểu Shop CSKH
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('f03_shop_chat_v4');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'welcome-bot',
        sender: 'bot',
        text: 'Xin chào! 👋 Mình là Trợ lý Tư vấn Thủ tục Hành chính & Dịch vụ công trực tuyến.\n\nBạn đang cần chuẩn bị giấy tờ cho thủ tục nào (Tạm trú, Căn cước, Hộ chiếu, Sang tên xe, Điện lực hay Khai sinh liên thông)? Hãy bấm chọn nhanh bên dưới hoặc nhắn câu hỏi của bạn nhé!',
        timestamp: 'Trực tuyến 24/7'
      }
    ];
  });

  const [aiCache, setAiCache] = useState<Record<string, { text: string; procId?: string }>>(() => {
    try {
      const saved = localStorage.getItem('f03_ai_cache_v4');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Cửa sổ Chat mini nổi ở góc phải
  const [isMiniChatOpen, setIsMiniChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Hỗ trợ tiếp cận (Accessibility)
  const [largeTextMode, setLargeTextMode] = useState<boolean>(false);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('f03_doc_states_v4', JSON.stringify(docStates));
    } catch (e) {
      console.error(e);
    }
  }, [docStates]);

  useEffect(() => {
    try {
      localStorage.setItem('f03_notes_v4', JSON.stringify(personalNotes));
    } catch (e) {
      console.error(e);
    }
  }, [personalNotes]);

  useEffect(() => {
    try {
      localStorage.setItem('f03_shop_chat_v4', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  useEffect(() => {
    try {
      localStorage.setItem('f03_ai_cache_v4', JSON.stringify(aiCache));
    } catch (e) {
      console.error(e);
    }
  }, [aiCache]);

  const selectedProcedure = useMemo(
    () => PROCEDURES.find((p) => p.id === selectedProcedureId) || PROCEDURES[0],
    [selectedProcedureId]
  );

  const currentScenarios = useMemo(
    () => getProcedureScenarios(selectedProcedure),
    [selectedProcedure]
  );

  useEffect(() => {
    if (currentScenarios.length > 0) {
      setSelectedScenarioId(currentScenarios[0].id);
    }
  }, [selectedProcedureId, currentScenarios]);

  const activeScenario = useMemo(
    () => currentScenarios.find((s) => s.id === selectedScenarioId) || currentScenarios[0],
    [currentScenarios, selectedScenarioId]
  );

  const activeChecklist = useMemo(() => {
    if (activeScenario?.extraRequirement) {
      return [...selectedProcedure.checklist, activeScenario.extraRequirement];
    }
    return selectedProcedure.checklist;
  }, [selectedProcedure, activeScenario]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [activeTab, selectedProcedureId]);

  const getProcedureProgress = (proc: Procedure) => {
    const items = proc.checklist;
    const total = items.length;
    if (total === 0) return { done: 0, total: 0, percent: 0 };
    const done = items.filter((item) => docStates[item.id] && docStates[item.id] !== 'none').length;
    return {
      done,
      total,
      percent: Math.round((done / total) * 100)
    };
  };

  const stats = useMemo(() => {
    let preparing = 0;
    let completed = 0;
    PROCEDURES.forEach((p) => {
      const prog = getProcedureProgress(p);
      if (prog.done > 0 && prog.done < prog.total) preparing++;
      if (prog.done === prog.total && prog.total > 0) completed++;
    });
    return { preparing, completed };
  }, [docStates]);

  const filteredProcedures = useMemo(() => {
    return PROCEDURES.filter((proc) => {
      const matchesCat = selectedCategory === 'all' || proc.category === selectedCategory;
      const q = removeAccents(searchQuery.trim());
      const matchesQuery =
        !q ||
        removeAccents(proc.title).includes(q) ||
        removeAccents(proc.summary).includes(q) ||
        removeAccents(proc.categoryName).includes(q) ||
        removeAccents(proc.tag).includes(q) ||
        proc.legalBasis.some((b) => removeAccents(b).includes(q));

      if (onlyPreparingFilter) {
        const prog = getProcedureProgress(proc);
        const hasNote = !!personalNotes[proc.id]?.trim();
        return matchesCat && matchesQuery && (prog.done > 0 || hasNote);
      }
      return matchesCat && matchesQuery;
    });
  }, [searchQuery, selectedCategory, onlyPreparingFilter, docStates, personalNotes]);

  const groupedProcedures = useMemo(() => {
    const groups: { categoryId: Exclude<CategoryId, 'all'>; categoryName: string; items: Procedure[] }[] = [];
    const catOrder: Exclude<CategoryId, 'all'>[] = [
      'cu-tru',
      'can-cuoc',
      'tu-phap',
      'phuong-tien',
      'lien-thong',
      'dien-luc',
      'xuat-nhap-canh',
      'khac-vneid',
      'dan-su-mo-rong'
    ];
    catOrder.forEach((catId) => {
      const items = filteredProcedures.filter((p) => p.category === catId);
      if (items.length > 0) {
        groups.push({
          categoryId: catId,
          categoryName: items[0].categoryName,
          items
        });
      }
    });
    return groups;
  }, [filteredProcedures]);

  const filteredReferences = useMemo(() => {
    const q = removeAccents(refSearchQuery.trim());
    if (!q) return REFERENCE_SOURCES;
    return REFERENCE_SOURCES.filter(
      (r) =>
        removeAccents(r.title).includes(q) ||
        removeAccents(r.agency).includes(q) ||
        removeAccents(r.description).includes(q)
    );
  }, [refSearchQuery]);

  const setDocumentState = (itemId: string, state: DocReadyState) => {
    setDocStates((prev) => ({
      ...prev,
      [itemId]: state
    }));
  };

  const markAllReady = (items: ChecklistItem[], mode: DocReadyState = 'vneid') => {
    const updates: Record<string, DocReadyState> = { ...docStates };
    items.forEach((item) => {
      updates[item.id] = mode;
    });
    setDocStates(updates);
  };

  const resetProcedureDocs = (items: ChecklistItem[]) => {
    const updates: Record<string, DocReadyState> = { ...docStates };
    items.forEach((item) => {
      delete updates[item.id];
    });
    setDocStates(updates);
  };

  const openProcedureConfigurator = (procId: string) => {
    setSelectedProcedureId(procId);
    setActiveTab('detail');
    setIsMiniChatOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyChecklistToClipboard = (proc: Procedure) => {
    const lines = [
      `📋 HỒ SƠ THỦ TỤC: ${proc.title.toUpperCase()}`,
      `🎯 Trường hợp: ${activeScenario?.label || 'Mặc định'}`,
      `🏛️ Cơ quan tiếp nhận: ${proc.agency}`,
      `⏱️ Thời hạn giải quyết: ${proc.duration}`,
      `💰 Lệ phí: ${proc.fee}`,
      `\n✅ DANH SÁCH GIẤY TỜ CẦN CHUẨN BỊ:`,
      ...activeChecklist.map((item, idx) => {
        const st = docStates[item.id] || 'none';
        const stLabel =
          st === 'vneid' ? 'Đã có trên VNeID' : st === 'paper' ? 'Đã có bản giấy' : 'Chưa chuẩn bị';
        return `${idx + 1}. [${stLabel}] ${item.name} (${item.type} - ${item.quantity})\n   -> Hướng dẫn: ${item.note}`;
      }),
      `\n⚠️ Lưu ý tránh bị trả hồ sơ: ${activeScenario?.rejectionWarning}`,
      `🔗 Cổng dịch vụ công: ${proc.portalUrl}`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedId(proc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleSpeakProcedure = (proc: Procedure) => {
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ đọc giọng nói trực tiếp.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const textToRead = `${proc.title}. Trường hợp áp dụng: ${activeScenario?.label}. Cơ quan tiếp nhận: ${proc.agency}. Thời hạn giải quyết: ${proc.duration}. Hồ sơ cần chuẩn bị gồm: ${activeChecklist
      .map((c, idx) => `Mục ${idx + 1}: ${c.name}.`)
      .join(' ')} Lưu ý quan trọng: ${activeScenario?.rejectionWarning}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // ==========================================
  // 7. GỬI TIN NHẮN CHATBOT CSKH (GEMINI API)
  // ==========================================
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? chatInput).trim();
    if (!textToSend || isAiLoading) return;

    const nowTime = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: nowTime
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');

    const cacheKey = textToSend.toLowerCase();
    if (aiCache[cacheKey] && !aiCache[cacheKey].text.includes('⚠️')) {
      const cachedReply = aiCache[cacheKey];
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: cachedReply.text,
            recommendedProcedureId: cachedReply.procId,
            timestamp: nowTime
          }
        ]);
      }, 350);
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const knowledgeBaseContext = PROCEDURES.map(
        (p) =>
          `- ID: "${p.id}" | Nhóm: ${p.categoryName} | Tên thủ tục: ${p.title} (${p.tag})
  + Cơ quan: ${p.agency} | Thời hạn: ${p.duration} | Phí: ${p.fee}
  + Căn cứ: ${p.legalBasis.join('; ')}
  + Hồ sơ: ${p.checklist.map((c) => `${c.name} (${c.type})`).join('; ')}
  + Các bước: ${p.steps.join(' -> ')}`
      ).join('\n');

      const systemInstruction = `Bạn là Trợ lý Tư vấn Thủ tục Hành chính & Dịch vụ công VNeID trực tuyến.
Phong cách giao tiếp: Thân thiện, lịch sự, rõ ràng và tận tâm như chuyên viên tư vấn dịch vụ công.
Dưới đây là CƠ SỞ DỮ LIỆU THỦ TỤC HÀNH CHÍNH ĐÃ KIỂM CHỨNG:

${knowledgeBaseContext}

QUY TẮC PHẢN HỒI BẮT BUỘC:
1. Trả lời ngắn gọn, súc tích, dễ đọc trên khung chat theo cấu trúc:
   • 🎯 **Thủ tục cần làm:** ...
   • 📋 **Giấy tờ cần chuẩn bị:** ...
   • 🏛️ **Nơi nộp & Thời hạn:** ...
   • ⚖️ **Căn cứ pháp lý:** ...
   • 💡 **Lưu ý để không bị trả hồ sơ:** ...
2. Nếu câu hỏi khớp với một thủ tục trong danh sách trên, ở dòng cuối cùng hãy gắn thẻ: [MA_THU_TUC:id_thu_tuc] (ví dụ: [MA_THU_TUC:cap-ho-chieu-pho-thong]).
3. Nếu người dùng nhờ kiểm tra bộ hồ sơ họ đang chuẩn bị, hãy nhận xét rõ họ đã đủ điều kiện đi nộp chưa, giấy tờ nào còn thiếu là quan trọng nhất và dặn dò cách nộp.
4. Tuyệt đối không tự bịa đặt mức phạt hay văn bản pháp luật ngoài dữ liệu. Nếu nằm ngoài dữ liệu, hướng dẫn người dân tra cứu tại https://dichvucong.gov.vn hoặc ứng dụng VNeID.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: textToSend,
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });

      const rawText = response.text || 'Xin lỗi, hiện tại mình chưa nhận được phản hồi. Bạn thử lại nhé!';
      const match = rawText.match(/\[MA_THU_TUC:([a-z0-9-]+)\]/i);
      const recommendedId =
        match && PROCEDURES.some((p) => p.id === match[1]) ? match[1] : undefined;
      const cleanAnswer = rawText.replace(/\[MA_THU_TUC:[a-z0-9-]+\]/gi, '').trim();

      setAiCache((prev) => ({
        ...prev,
        [cacheKey]: { text: cleanAnswer, procId: recommendedId }
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: cleanAnswer,
          recommendedProcedureId: recommendedId,
          timestamp: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      ]);
    } catch (error) {
      console.warn('Gemini API call failed, generating smart fallback without error notification:', error);
      const fallback = buildFallbackResponse(textToSend);

      setAiCache((prev) => ({
        ...prev,
        [cacheKey]: { text: fallback.text, procId: fallback.procId }
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-fallback-${Date.now()}`,
          sender: 'bot',
          text: fallback.text,
          recommendedProcedureId: fallback.procId,
          timestamp: nowTime
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const sendCurrentChecklistToBot = () => {
    const readyList = activeChecklist
      .filter((i) => docStates[i.id] && docStates[i.id] !== 'none')
      .map((i) => `${i.name} (${docStates[i.id] === 'vneid' ? 'Đã có trên VNeID' : 'Đã có bản giấy'})`);
    const missingList = activeChecklist
      .filter((i) => !docStates[i.id] || docStates[i.id] === 'none')
      .map((i) => i.name);

    const checkPrompt = `Nhờ Trợ lý kiểm tra giúp bộ hồ sơ tôi đang chuẩn bị:
- Thủ tục: ${selectedProcedure.title}
- Trường hợp của tôi: ${activeScenario?.label}
- Giấy tờ ĐÃ CÓ (${readyList.length}/${activeChecklist.length}): ${readyList.length > 0 ? readyList.join('; ') : 'Chưa có giấy tờ nào'}
- Giấy tờ CÒN THIẾU (${missingList.length}): ${missingList.length > 0 ? missingList.join('; ') : 'Đã chuẩn bị đủ 100%'}
Cho tôi hỏi hồ sơ như vậy đã nộp được chưa và cần lưu ý gì để không bị trả hồ sơ?`;

    setActiveTab('assistant');
    setIsMiniChatOpen(false);
    handleSendMessage(checkPrompt);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        highContrastMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      } ${largeTextMode ? 'text-lg leading-relaxed' : 'text-base'}`}
    >
      {/* ==========================================
          HEADER CHÍNH
      ========================================== */}
      <header
        className={`sticky top-0 z-30 border-b shadow-sm print:hidden ${
          highContrastMode
            ? 'bg-slate-900 border-yellow-400 text-white'
            : 'bg-gradient-to-r from-red-800 via-red-700 to-red-800 border-red-900 text-white'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Biểu trưng SVG Hoa sen & Khiên hành chính */}
          <button
            onClick={() => setActiveTab('lookup')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0 ${
                highContrastMode
                  ? 'bg-yellow-400 text-slate-950'
                  : 'bg-amber-400 text-red-950 border-2 border-amber-200'
              }`}
            >
              <svg viewBox="0 0 40 40" className="w-7 h-7 fill-current">
                <path d="M20 3L6 9v10c0 9.5 6 17.5 14 20 8-2.5 14-10.5 14-20V9L20 3zm0 4.2l10 4.3v7.5c0 7.3-4.5 13.7-10 15.8-5.5-2.1-10-8.5-10-15.8v-7.5l10-4.3z" />
                <path d="M20 11c-1.8 3.2-3 6-3 8.5 0 2 1.3 3.5 3 3.5s3-1.5 3-3.5c0-2.5-1.2-5.3-3-8.5zm-4.5 4.2c-2.2 1.8-3.5 4-3.5 6 0 1.8 1.5 3.1 3.8 3.3-1-1.2-1.3-2.6-1.3-4.2 0-1.7.4-3.4 1-5.1zm9 0c.6 1.7 1 3.4 1 5.1 0 1.6-.3 3-1.3 4.2 2.3-.2 3.8-1.5 3.8-3.3 0-2-1.3-4.2-3.5-6zM13 26.5c2.1 1.5 4.5 2.2 7 2.2s4.9-.7 7-2.2H13z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-red-950">
                  Dịch vụ công & VNeID ★
                </span>
                <span className="text-xs text-amber-200 hidden sm:inline">
                  Tra cứu & Chuẩn bị hồ sơ trực tuyến
                </span>
              </div>
              <h1 className="font-bold text-lg sm:text-xl tracking-tight group-hover:underline">
                {lang === 'vi'
                  ? 'Cẩm Nang Thủ Tục Hành Chính Thiết Yếu'
                  : 'Essential Public Administrative Procedures'}
              </h1>
            </div>
          </button>

          {/* Cụm công cụ hỗ trợ */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setLang((prev) => (prev === 'vi' ? 'en' : 'vi'))}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/25 transition"
              title="Chuyển đổi ngôn ngữ Việt / Anh"
            >
              {lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
            </button>

            <button
              onClick={() => setLargeTextMode((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                largeTextMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{largeTextMode ? 'Chữ lớn: BẬT' : 'Chữ lớn'}</span>
            </button>

            <button
              onClick={() => setHighContrastMode((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                highContrastMode
                  ? 'bg-yellow-400 text-slate-950 border-yellow-300 font-bold'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Contrast className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tương phản</span>
            </button>
          </div>
        </div>

        {/* Thanh điều hướng */}
        <nav
          className={`border-t ${
            highContrastMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-red-900/90 border-red-800'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === 'lookup'
                  ? highContrastMode
                    ? 'bg-yellow-400 text-slate-950 font-bold'
                    : 'bg-amber-400 text-red-950 font-bold shadow-sm'
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Tra cứu thủ tục' : 'Procedures'}</span>
            </button>

            <button
              onClick={() => setActiveTab('detail')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === 'detail'
                  ? highContrastMode
                    ? 'bg-yellow-400 text-slate-950 font-bold'
                    : 'bg-amber-400 text-red-950 font-bold shadow-sm'
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Chuẩn bị hồ sơ' : 'Document Checklist'}</span>
              {(stats.preparing > 0 || stats.completed > 0) && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-600 text-white">
                  {stats.preparing + stats.completed}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('assistant');
                setIsMiniChatOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === 'assistant'
                  ? highContrastMode
                    ? 'bg-yellow-400 text-slate-950 font-bold'
                    : 'bg-amber-400 text-red-950 font-bold shadow-sm'
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Trợ lý tư vấn' : 'AI Support Chat'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveTab('references')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === 'references'
                  ? highContrastMode
                    ? 'bg-yellow-400 text-slate-950 font-bold'
                    : 'bg-amber-400 text-red-950 font-bold shadow-sm'
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Nguồn pháp lý' : 'Legal Sources'}</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === 'about'
                  ? highContrastMode
                    ? 'bg-yellow-400 text-slate-950 font-bold'
                    : 'bg-amber-400 text-red-950 font-bold shadow-sm'
                  : 'text-amber-100 hover:bg-white/10'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Giới thiệu' : 'About'}</span>
            </button>
          </div>
        </nav>
      </header>

      {/* ==========================================
          NỘI DUNG CHÍNH
      ========================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 pb-24 sm:pb-12">
        {/* ------------------------------------------
            MÀN HÌNH 1: TRA CỨU THỦ TỤC HÀNH CHÍNH
        ------------------------------------------ */}
        {activeTab === 'lookup' && (
          <div className="space-y-6">
            <div
              className={`rounded-2xl p-5 sm:p-6 border shadow-sm ${
                highContrastMode
                  ? 'bg-slate-900 border-yellow-400'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-red-800 dark:text-amber-400">
                    {lang === 'vi'
                      ? 'Thủ tục hành chính trên VNeID & Dịch vụ công'
                      : 'Public Administrative Procedures on VNeID'}
                  </h2>
                  <p className="text-xs sm:text-sm opacity-75 mt-0.5">
                    Chọn thủ tục bạn cần làm để xem danh mục giấy tờ tương ứng với từng trường hợp cụ thể.
                  </p>
                </div>

                {/* Bộ lọc hồ sơ đang chuẩn bị & Đổi bố cục */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOnlyPreparingFilter((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      onlyPreparingFilter
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    📌 Hồ sơ của tôi ({stats.preparing + stats.completed})
                  </button>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-slate-700">
                    <button
                      onClick={() => setViewMode('vneid-grid')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        viewMode === 'vneid-grid'
                          ? 'bg-red-700 text-white shadow-sm'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Biểu tượng</span>
                    </button>
                    <button
                      onClick={() => setViewMode('detailed-cards')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        viewMode === 'detailed-cards'
                          ? 'bg-red-700 text-white shadow-sm'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Danh sách</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Ô tìm kiếm tròn */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bạn đang muốn tìm kiếm thủ tục nào? (VD: tạm trú, căn cước, hộ chiếu, cấp điện, khai sinh...)"
                  className={`w-full pl-5 pr-12 py-3.5 rounded-full border text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    highContrastMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>

              {/* Thanh lọc nhóm lĩnh vực */}
              <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap border transition ${
                        isSelected
                          ? highContrastMode
                            ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-bold'
                            : 'bg-red-700 text-white border-red-700 shadow-sm'
                          : highContrastMode
                          ? 'bg-slate-800 text-white border-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {cat.icon}
                      <span>{lang === 'vi' ? cat.name : cat.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Danh sách thủ tục */}
            {filteredProcedures.length === 0 ? (
              <div className="rounded-2xl p-8 text-center bg-white border border-slate-200">
                <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-2" />
                <h3 className="font-bold text-lg">
                  Không tìm thấy thủ tục phù hợp
                </h3>
                <p className="text-sm opacity-75 mt-1">
                  Hãy nhắn trực tiếp cho Trợ lý tư vấn để được hướng dẫn đúng với trường hợp của bạn.
                </p>
                <button
                  onClick={() => {
                    if (searchQuery) handleSendMessage(searchQuery);
                    setActiveTab('assistant');
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 text-white text-sm font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hỏi Trợ lý tư vấn ngay</span>
                </button>
              </div>
            ) : viewMode === 'vneid-grid' ? (
              <div className="space-y-6">
                {groupedProcedures.map((group) => (
                  <div
                    key={group.categoryId}
                    className={`rounded-2xl p-5 sm:p-6 border shadow-sm ${
                      highContrastMode
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-5 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                          🏛️
                        </div>
                        <h3
                          className={`font-bold text-base sm:text-lg ${
                            highContrastMode ? 'text-yellow-400' : 'text-red-700'
                          }`}
                        >
                          {group.categoryName}
                        </h3>
                      </div>
                      <span className="text-xs opacity-60 hidden sm:inline">
                        Chạm vào thủ tục để xem giấy tờ cần chuẩn bị
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {group.items.map((proc) => {
                        const progress = getProcedureProgress(proc);
                        return (
                          <button
                            key={proc.id}
                            onClick={() => openProcedureConfigurator(proc.id)}
                            className={`relative p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition group ${
                              highContrastMode
                                ? 'bg-slate-800 border-slate-700 hover:border-yellow-400'
                                : 'bg-slate-50/70 border-slate-200/80 hover:bg-red-50/50 hover:border-red-300 hover:shadow-sm'
                            }`}
                          >
                            {proc.isNew && (
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-sm">
                                Mới
                              </span>
                            )}

                            <div className="flex flex-col items-center">
                              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-100 to-amber-200 border-2 border-red-700/80 flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                                {proc.category === 'dien-luc' ? (
                                  <Zap className="w-7 h-7 text-red-700" />
                                ) : proc.category === 'xuat-nhap-canh' ? (
                                  <Globe className="w-7 h-7 text-red-700" />
                                ) : proc.category === 'phuong-tien' ? (
                                  <Car className="w-7 h-7 text-red-700" />
                                ) : proc.category === 'can-cuoc' ? (
                                  <CreditCard className="w-7 h-7 text-red-700" />
                                ) : proc.category === 'lien-thong' ? (
                                  <Layers className="w-7 h-7 text-red-700" />
                                ) : (
                                  <FileText className="w-7 h-7 text-red-700" />
                                )}
                              </div>

                              <span className="font-semibold text-xs sm:text-sm leading-snug line-clamp-3 group-hover:text-red-700">
                                {proc.title}
                              </span>
                            </div>

                            <div className="w-full mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-center text-[11px]">
                              {progress.done > 0 ? (
                                <span className="text-emerald-600 font-bold">
                                  ✓ Đã chuẩn bị {progress.done}/{progress.total}
                                </span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                                  {proc.tag}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProcedures.map((proc) => {
                  const progress = getProcedureProgress(proc);
                  return (
                    <div
                      key={proc.id}
                      onClick={() => openProcedureConfigurator(proc.id)}
                      className={`cursor-pointer rounded-2xl p-5 border transition flex flex-col justify-between group ${
                        highContrastMode
                          ? 'bg-slate-900 border-slate-700 hover:border-yellow-400'
                          : 'bg-white border-slate-200 hover:border-red-500 hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-50 text-red-800">
                            {proc.categoryName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {proc.isNew && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                                Mới
                              </span>
                            )}
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                              {proc.tag}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-bold text-base sm:text-lg group-hover:text-red-700">
                          {proc.title}
                        </h3>

                        <p className="text-xs sm:text-sm opacity-80 line-clamp-2">
                          {proc.summary}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-medium">
                          Đã chuẩn bị: {progress.done}/{progress.total} giấy tờ
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                          <span>Chuẩn bị hồ sơ</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------
            MÀN HÌNH 2: CHUẨN BỊ HỒ SƠ 3 BƯỚC
        ------------------------------------------ */}
        {activeTab === 'detail' && (
          <div className="space-y-6">
            {/* TIÊU ĐỀ CHỈ HIỆN KHI IN / XUẤT PDF TRANG A4 */}
            <div className="hidden print:block mb-6 p-6 border-b-2 border-slate-900 bg-white text-slate-950">
              <div className="text-center pb-3 border-b border-slate-300">
                <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-600">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — ĐỘC LẬP • TỰ DO • HẠNH PHÚC
                </span>
                <h1 className="text-xl font-bold uppercase tracking-wide mt-2 text-slate-900">
                  PHIẾU KIỂM TRA HỒ SƠ THỦ TỤC HÀNH CHÍNH - CẨM NANG DỊCH VỤ CÔNG
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  (Dữ liệu chuẩn hóa theo Cổng Dịch vụ công Quốc gia & Ứng dụng định danh điện tử VNeID)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs">
                <div><strong>Thủ tục hành chính:</strong> {selectedProcedure.title} ({selectedProcedure.tag})</div>
                <div><strong>Lĩnh vực:</strong> {selectedProcedure.categoryName}</div>
                <div><strong>Trường hợp áp dụng:</strong> {activeScenario?.label || 'Mặc định'}</div>
                <div><strong>Cơ quan giải quyết:</strong> {selectedProcedure.agency}</div>
                <div><strong>Thời hạn giải quyết:</strong> {selectedProcedure.duration}</div>
                <div><strong>Lệ phí nhà nước:</strong> {selectedProcedure.fee}</div>
                <div><strong>Thời điểm lập phiếu:</strong> {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                <div><strong>Cổng nộp trực tuyến:</strong> {selectedProcedure.portalUrl}</div>
              </div>
            </div>

            {/* BƯỚC 1: CHỌN THỦ TỤC CẦN LÀM */}
            <div
              className={`rounded-2xl p-5 sm:p-6 border shadow-sm ${
                highContrastMode
                  ? 'bg-slate-900 border-yellow-400'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="font-bold text-base sm:text-lg">
                    Bước 1: Chọn lĩnh vực và thủ tục cần làm
                  </h2>
                </div>

                <button
                  onClick={() => setActiveTab('lookup')}
                  className="print:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại trang tra cứu</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold opacity-70 mb-1">
                    Nhóm dịch vụ:
                  </label>
                  <select
                    value={selectedProcedure.category}
                    onChange={(e) => {
                      const cat = e.target.value as Exclude<CategoryId, 'all'>;
                      const firstInCat = PROCEDURES.find((p) => p.category === cat);
                      if (firstInCat) setSelectedProcedureId(firstInCat.id);
                    }}
                    className={`w-full p-3 rounded-xl border text-sm font-medium ${
                      highContrastMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold opacity-70 mb-1">
                    Thủ tục hành chính:
                  </label>
                  <select
                    value={selectedProcedure.id}
                    onChange={(e) => setSelectedProcedureId(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm font-bold ${
                      highContrastMode
                        ? 'bg-slate-800 border-yellow-400 text-white'
                        : 'bg-red-50/60 border-red-300 text-red-950'
                    }`}
                  >
                    {PROCEDURES.filter(
                      (p) => p.category === selectedProcedure.category
                    ).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} — ({p.tag})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/70 text-xs sm:text-sm">
                <div className={`p-3 rounded-xl ${highContrastMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className="font-bold text-red-700 block">🏛️ Cơ quan giải quyết:</span>
                  <span>{selectedProcedure.agency}</span>
                </div>
                <div className={`p-3 rounded-xl ${highContrastMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className="font-bold text-emerald-700 block">⏱️ Thời gian xử lý:</span>
                  <span>{selectedProcedure.duration}</span>
                </div>
                <div className={`p-3 rounded-xl ${highContrastMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className="font-bold text-amber-700 block">💰 Lệ phí nhà nước:</span>
                  <span>{selectedProcedure.fee}</span>
                </div>
              </div>
            </div>

            {/* BƯỚC 2: CHỌN TRƯỜNG HỢP CỦA NGƯỜI DÙNG */}
            <div
              className={`rounded-2xl p-5 sm:p-6 border shadow-sm ${
                highContrastMode
                  ? 'bg-slate-900 border-yellow-400'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-7 h-7 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    Bước 2: Bạn thuộc trường hợp nào dưới đây?
                  </h3>
                  <p className="text-xs opacity-75">
                    Chọn đúng hoàn cảnh của bạn để hiển thị danh sách giấy tờ chính xác nhất.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
                {currentScenarios.map((sc) => {
                  const isSelected = activeScenario?.id === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedScenarioId(sc.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition flex flex-col justify-between gap-2 ${
                        isSelected
                          ? highContrastMode
                            ? 'bg-slate-800 border-yellow-400'
                            : 'bg-red-50/70 border-red-700 shadow-sm'
                          : highContrastMode
                          ? 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                          : 'bg-slate-50/60 border-slate-200 hover:border-red-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-red-700 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {sc.badge}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-red-700 shrink-0" />
                          )}
                        </div>
                        <h4 className="font-bold text-sm sm:text-base">
                          {sc.label}
                        </h4>
                        <p className="text-xs opacity-80 leading-relaxed">
                          {sc.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BƯỚC 3: ĐÁNH DẤU GIẤY TỜ ĐÃ CHUẨN BỊ */}
            <div
              className={`rounded-2xl p-5 sm:p-6 border shadow-sm ${
                highContrastMode
                  ? 'bg-slate-900 border-yellow-400'
                  : 'bg-white border-slate-200'
              }`}
            >
              {(() => {
                const total = activeChecklist.length;
                const done = activeChecklist.filter(
                  (i) => docStates[i.id] && docStates[i.id] !== 'none'
                ).length;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center">
                          3
                        </span>
                        <div>
                          <h3 className="font-bold text-base sm:text-lg">
                            Bước 3: Đánh dấu giấy tờ bạn đã có ({done}/{total})
                          </h3>
                          <p className="text-xs opacity-75">
                            Bấm chọn "Đã có bản giấy" hoặc "Có trên VNeID" cho từng giấy tờ bạn đã chuẩn bị xong.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setIsVneidGuideOpen(true)}
                          className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition shadow-xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>📄 Hướng dẫn kê khai trên VNeID</span>
                        </button>
                        <button
                          onClick={() => markAllReady(activeChecklist, 'vneid')}
                          className="print:hidden px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        >
                          Đã có đủ tất cả
                        </button>
                        <button
                          onClick={() => resetProcedureDocs(activeChecklist)}
                          className="print:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Đặt lại</span>
                        </button>
                        <button
                          onClick={() => toggleSpeakProcedure(selectedProcedure)}
                          className={`print:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            isSpeaking
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-amber-50 text-red-900 border-amber-300'
                          }`}
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span>{isSpeaking ? 'Dừng đọc' : 'Nghe hướng dẫn'}</span>
                        </button>
                        <button
                          onClick={() => copyChecklistToClipboard(selectedProcedure)}
                          className="print:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          {copiedId === selectedProcedure.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="print:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>In danh sách</span>
                        </button>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Mức độ hoàn thiện hồ sơ</span>
                        <span className="text-emerald-600 font-bold">{percent}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {activeChecklist.map((item, idx) => {
                        const currentState: DocReadyState = docStates[item.id] || 'none';
                        const isDone = currentState !== 'none';

                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border transition ${
                              isDone
                                ? highContrastMode
                                  ? 'bg-emerald-950/50 border-emerald-400'
                                  : 'bg-emerald-50/50 border-emerald-300'
                                : highContrastMode
                                ? 'bg-slate-800 border-slate-700'
                                : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-xs">
                                    Giấy tờ {idx + 1}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    {item.type}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
                                    {item.quantity}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm sm:text-base pt-1">
                                  {item.name}
                                </h4>
                                <p className="text-xs sm:text-sm opacity-80">
                                  💡 <strong>Lưu ý:</strong> {item.note}
                                </p>
                              </div>

                              <div className="print:hidden flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 shrink-0">
                                <button
                                  onClick={() => setDocumentState(item.id, 'none')}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    currentState === 'none'
                                      ? 'bg-slate-800 text-white'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  ⏳ Chưa có
                                </button>
                                <button
                                  onClick={() => setDocumentState(item.id, 'paper')}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    currentState === 'paper'
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                  <span>Đã có bản giấy</span>
                                </button>
                                <button
                                  onClick={() => setDocumentState(item.id, 'vneid')}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    currentState === 'vneid'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                  <span>Có trên VNeID</span>
                                </button>
                              </div>

                              <div className="hidden print:inline-block text-xs font-bold px-3 py-1.5 border rounded-lg border-slate-700 shrink-0">
                                {currentState === 'vneid' ? '☑ Có trên VNeID' : currentState === 'paper' ? '☑ Đã có bản giấy' : '☐ Chưa chuẩn bị'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {activeScenario && (
                      <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-950 text-xs sm:text-sm space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-red-800">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Kinh nghiệm tránh bị trả hồ sơ ({activeScenario.label}):</span>
                        </div>
                        <p>{activeScenario.rejectionWarning}</p>
                      </div>
                    )}

                    <div className="print:hidden mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-[240px]">
                        <input
                          type="text"
                          value={personalNotes[selectedProcedure.id] || ''}
                          onChange={(e) =>
                            setPersonalNotes((prev) => ({
                              ...prev,
                              [selectedProcedure.id]: e.target.value
                            }))
                          }
                          placeholder="Ghi chú nhắc việc riêng của bạn (tự động lưu trên máy)..."
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm ${
                            highContrastMode
                              ? 'bg-slate-800 border-slate-600 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-900'
                          }`}
                        />
                      </div>

                      <button
                        onClick={sendCurrentChecklistToBot}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white text-xs sm:text-sm font-bold shadow-sm transition"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Nhờ Trợ lý AI kiểm tra bộ hồ sơ này</span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* TRÌNH TỰ THỰC HIỆN & CĂN CỨ PHÁP LÝ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                className={`lg:col-span-2 rounded-2xl p-6 border shadow-sm ${
                  highContrastMode ? 'bg-slate-900 border-yellow-400' : 'bg-white border-slate-200'
                }`}
              >
                <h3 className="text-lg font-bold mb-4">Trình tự các bước thực hiện</h3>
                <div className="space-y-4">
                  {selectedProcedure.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3.5">
                      <div className="w-7 h-7 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm sm:text-base flex-1">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-sm">
                  <strong>📌 Lưu ý thêm:</strong> {selectedProcedure.importantNotes}
                </div>
              </div>

              <div
                className={`rounded-2xl p-6 border shadow-sm flex flex-col justify-between ${
                  highContrastMode ? 'bg-slate-900 border-yellow-400' : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Căn cứ pháp lý</h3>
                  <ul className="space-y-2.5 text-sm">
                    {selectedProcedure.legalBasis.map((law, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-100/80 text-slate-800"
                      >
                        <Scale className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                        <span>{law}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 print:hidden">
                  <a
                    href={selectedProcedure.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-sm shadow-sm transition"
                  >
                    <span>Nộp hồ sơ tại Cổng Dịch vụ công</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------
            MÀN HÌNH 3: TRỢ LÝ TƯ VẤN TRỰC TUYẾN (CHATBOT)
        ------------------------------------------ */}
        {activeTab === 'assistant' && (
          <div
            className={`rounded-2xl border shadow-md overflow-hidden flex flex-col h-[76vh] min-h-[540px] ${
              highContrastMode ? 'bg-slate-900 border-yellow-400' : 'bg-white border-slate-200'
            }`}
          >
            <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-red-950 flex items-center justify-center font-bold shadow">
                    <Bot className="w-6 h-6" />
                  </div>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-red-800 absolute bottom-0 right-0" />
                </div>
                <div>
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <span>Trợ lý Tư vấn Hành chính Công</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-semibold">
                      AI Trực tuyến
                    </span>
                  </h2>
                  <p className="text-xs text-amber-200">
                    Đang hoạt động • Giải đáp quy trình, hồ sơ & lệ phí theo quy định hiện hành
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome-reset',
                      sender: 'bot',
                      text: 'Đã làm mới cuộc trò chuyện! 👋 Bạn cần mình tư vấn thủ tục hành chính nào, hãy chọn bên dưới hoặc nhắn cho mình nhé!',
                      timestamp: 'Vừa xong'
                    }
                  ])
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa trò chuyện</span>
              </button>
            </div>

            <div
              className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ${
                highContrastMode ? 'bg-slate-950' : 'bg-slate-100/80'
              }`}
            >
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const matchedProc = msg.recommendedProcedureId
                  ? PROCEDURES.find((p) => p.id === msg.recommendedProcedureId)
                  : undefined;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-red-700 text-amber-300 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl shadow-sm text-sm sm:text-base whitespace-pre-line leading-relaxed ${
                          isUser
                            ? 'bg-red-700 text-white rounded-br-xs'
                            : highContrastMode
                            ? 'bg-slate-800 text-white border border-slate-700 rounded-bl-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Thẻ Thủ tục đính kèm ngay trong tin nhắn của Bot */}
                      {matchedProc && (
                        <div
                          className={`p-3.5 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            highContrastMode
                              ? 'bg-slate-900 border-yellow-400'
                              : 'bg-amber-50/90 border-amber-300 text-slate-900'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-700 text-white">
                              {matchedProc.tag}
                            </span>
                            <h4 className="font-bold text-sm sm:text-base pt-1">
                              {matchedProc.title}
                            </h4>
                            <p className="text-xs opacity-75">
                              ⏱️ {matchedProc.duration} • 💰 {matchedProc.fee}
                            </p>
                          </div>

                          <button
                            onClick={() => openProcedureConfigurator(matchedProc.id)}
                            className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold whitespace-nowrap shadow-sm transition"
                          >
                            👉 Chuẩn bị hồ sơ này
                          </button>
                        </div>
                      )}

                      <div
                        className={`text-[11px] opacity-60 px-1 ${
                          isUser ? 'text-right' : 'text-left'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-700 text-amber-300 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-bounce [animation-delay:300ms]" />
                    <span>Đang tra cứu quy định pháp luật...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div
              className={`p-3 sm:p-4 border-t space-y-2.5 ${
                highContrastMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {QUICK_REPLIES.map((qr, i) => (
                  <button
                    key={i}
                    disabled={isAiLoading}
                    onClick={() => handleSendMessage(qr.prompt)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 transition shrink-0"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhập câu hỏi hoặc hoàn cảnh của bạn (Nhấn Enter để gửi)..."
                  className={`flex-1 px-4 py-3 rounded-full border text-sm focus:outline-none focus:ring-2 focus:ring-red-600 ${
                    highContrastMode
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !chatInput.trim()}
                  className="px-5 py-3 rounded-full bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-bold text-sm inline-flex items-center gap-1.5 shadow-sm transition shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------
            MÀN HÌNH 4: NGUỒN PHÁP LÝ CHÍNH THỐNG
        ------------------------------------------ */}
        {activeTab === 'references' && (
          <div className="space-y-6">
            <div
              className={`rounded-2xl p-6 border shadow-sm ${
                highContrastMode ? 'bg-slate-900 border-yellow-400' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-red-700" />
                    <span>Danh mục Nguồn tham khảo & Cổng Dịch vụ công chính thống</span>
                  </h2>
                  <p className="text-sm opacity-80 mt-1">
                    Toàn bộ thủ tục hành chính, biểu mẫu và mức lệ phí trong ứng dụng được đối chiếu trực tiếp từ các nguồn chính thức dưới đây.
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={refSearchQuery}
                    onChange={(e) => setRefSearchQuery(e.target.value)}
                    placeholder="Tìm nhanh nguồn pháp lý..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm ${
                      highContrastMode
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReferences.map((ref, idx) => (
                  <div
                    key={ref.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                      highContrastMode
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-red-100 text-red-800">
                          Nguồn số {idx + 1} • {ref.type}
                        </span>
                        <span className="text-xs opacity-70">{ref.agency}</span>
                      </div>
                      <h3 className="font-bold text-base">{ref.title}</h3>
                      <p className="text-xs sm:text-sm opacity-80">{ref.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs font-mono text-red-700 truncate max-w-[220px]">
                        {ref.url}
                      </span>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold"
                      >
                        <span>Mở nguồn</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------
            MÀN HÌNH 5: GIỚI THIỆU DỰ ÁN
        ------------------------------------------ */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div
              className={`rounded-2xl p-6 sm:p-8 border shadow-sm space-y-6 ${
                highContrastMode ? 'bg-slate-900 border-yellow-400' : 'bg-white border-slate-200'
              }`}
            >
              <div className="border-b border-slate-200 pb-5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 mb-2">
                  CHƯƠNG TRÌNH THỰC TẬP SINH ĐỢT 15 • IMTA TECH x FPT POLYTECHNIC
                </span>
                <h2 className="text-2xl font-bold">
                  Giới thiệu sản phẩm & Thông tin thực tập sinh
                </h2>
                <p className="text-sm opacity-80 mt-1">
                  Dự án xã hội phi lợi nhuận – Phát triển văn hoá cộng đồng Việt Nam và các ứng dụng phụng sự xã hội.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-5 rounded-xl border space-y-2.5 ${
                    highContrastMode
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-red-50/60 border-red-200'
                  }`}
                >
                  <h3 className="font-bold text-base text-red-800">
                    1. Thông tin tác giả thực hiện
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <p>• <strong>Họ và tên:</strong> Trần Trung Hiếu</p>
                    <p>• <strong>Mã sinh viên:</strong> PH73027</p>
                    <p>• <strong>Nhóm thực tập:</strong> Nhóm 1 (STT 22)</p>
                    <p>• <strong>Đề tài:</strong> F03 – Cẩm Nang Thủ Tục Hành Chính Thiết Yếu</p>
                    <p>• <strong>Đơn vị tổ chức:</strong> Hợp tác giữa FPT Polytechnic và IMTA TECH</p>
                  </div>
                </div>

                <div
                  className={`p-5 rounded-xl border space-y-2.5 ${
                    highContrastMode
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <h3 className="font-bold text-base text-amber-900">
                    2. Giá trị phụng sự cộng đồng
                  </h3>
                  <p className="text-sm leading-relaxed">
                    Giúp người dân tra cứu nhanh các nhóm thủ tục hành chính trên VNeID và Dịch vụ công Quốc gia; tự chuẩn bị bộ hồ sơ theo đúng trường hợp thực tế của mình và trò chuyện trực tiếp với Trợ lý AI để rà soát giấy tờ trước khi đi nộp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lưu ý pháp lý cố định ở chân trang */}
        <div
          className={`mt-8 p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
            highContrastMode
              ? 'bg-slate-900 border-slate-700 text-slate-300'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div>
            <strong>Lưu ý pháp lý & Bảo mật:</strong> Thông tin trên ứng dụng chỉ mang tính chất tham khảo hỗ trợ chuẩn bị hồ sơ ban đầu, không thay thế văn bản pháp luật chính thức. Sản phẩm cộng đồng phi lợi nhuận thực hiện bởi{' '}
            <strong>Trần Trung Hiếu (PH73027 - Nhóm 1)</strong>.
          </div>
        </div>
      </main>

      {/* ==========================================
          BONG BÓNG CHATBOT NỔI Ở GÓC DƯỚI BÊN PHẢI
      ========================================== */}
      {activeTab !== 'assistant' && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-40 print:hidden">
          {isMiniChatOpen ? (
            <div
              className={`w-[340px] sm:w-[380px] h-[450px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
                highContrastMode ? 'bg-slate-900 border-yellow-400' : 'bg-white border-slate-300'
              }`}
            >
              <div className="bg-red-700 text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-300" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">Trợ lý Tư vấn Hồ sơ</h4>
                    <span className="text-[10px] text-amber-200 block">Trực tuyến 24/7</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsMiniChatOpen(false);
                      setActiveTab('assistant');
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-white/15 hover:bg-white/25"
                  >
                    Mở rộng
                  </button>
                  <button
                    onClick={() => setIsMiniChatOpen(false)}
                    className="p-1 rounded hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-100 text-xs sm:text-sm">
                {messages.slice(-6).map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl whitespace-pre-line ${
                        m.sender === 'user'
                          ? 'bg-red-700 text-white'
                          : 'bg-white text-slate-800 border border-slate-200'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="text-xs text-slate-500 italic">
                    Đang tra cứu quy định...
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2.5 border-t border-slate-200 bg-white flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi nhanh thủ tục..."
                  className="flex-1 px-3 py-2 rounded-full border border-slate-300 text-xs text-slate-900 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isAiLoading || !chatInput.trim()}
                  className="p-2 rounded-full bg-red-700 text-white disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setIsMiniChatOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm shadow-xl border-2 border-amber-300 transition hover:scale-105"
            >
              <MessageCircle className="w-5 h-5 text-amber-300" />
              <span>Chat tư vấn hồ sơ</span>
            </button>
          )}
        </div>
      )}

      {/* Thanh điều hướng dưới đáy trên điện thoại */}
      <div
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t grid grid-cols-5 py-1.5 px-1 print:hidden ${
          highContrastMode
            ? 'bg-slate-900 border-yellow-400 text-white'
            : 'bg-white border-slate-200 text-slate-700 shadow-lg'
        }`}
      >
        <button
          onClick={() => setActiveTab('lookup')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[11px] font-medium ${
            activeTab === 'lookup' ? 'text-red-700 font-bold' : 'opacity-75'
          }`}
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span>Tra cứu</span>
        </button>

        <button
          onClick={() => setActiveTab('detail')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[11px] font-medium ${
            activeTab === 'detail' ? 'text-red-700 font-bold' : 'opacity-75'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 mb-0.5" />
          <span>Hồ sơ</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('assistant');
            setIsMiniChatOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[11px] font-medium ${
            activeTab === 'assistant' ? 'text-red-700 font-bold' : 'opacity-75'
          }`}
        >
          <MessageCircle className="w-4 h-4 mb-0.5" />
          <span>Tư vấn</span>
        </button>

        <button
          onClick={() => setActiveTab('references')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[11px] font-medium ${
            activeTab === 'references' ? 'text-red-700 font-bold' : 'opacity-75'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>Nguồn</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[11px] font-medium ${
            activeTab === 'about' ? 'text-red-700 font-bold' : 'opacity-75'
          }`}
        >
          <Info className="w-4 h-4 mb-0.5" />
          <span>Giới thiệu</span>
        </button>
      </div>

      {/* ==========================================
          MODAL HƯỚNG DẪN ĐIỀN TỜ KHAI ĐIỆN TỬ TRÊN VNeID
      ========================================== */}
      {isVneidGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs print:hidden"
        >
          <div
            className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
              highContrastMode ? 'bg-slate-900 border-yellow-400 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-800 to-red-700 text-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg tracking-tight">
                    Hướng dẫn điền tờ khai điện tử & nộp qua VNeID
                  </h3>
                  <p className="text-xs text-amber-200 line-clamp-1">
                    Áp dụng cho: <strong>{selectedProcedure.title}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsVneidGuideOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - 4 Lưu ý thực tế */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Kê khai trực tuyến giúp rút ngắn 30-50% thời gian xử lý so với nộp trực tiếp. Dưới đây là <strong>4 lưu ý thực tế</strong> bạn cần nắm rõ để hồ sơ được phê duyệt ngay từ lần nộp đầu tiên:
                </p>
              </div>

              {/* Lưu ý 1 */}
              <div className={`p-4 rounded-2xl border ${highContrastMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm sm:text-base text-red-700 dark:text-red-400">
                      1. Kiểm tra thông tin tự động trích xuất từ CSDL Quốc gia về dân cư
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Khi mở biểu mẫu trên VNeID hoặc Cổng Dịch vụ công, hệ thống tự động điền sẵn Họ tên, Số định danh cá nhân (12 số CCCD), Ngày sinh, Giới tính, Quê quán và Nơi thường trú từ Cơ sở dữ liệu quốc gia về dân cư.
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 font-medium pt-1">
                      👉 <em>Mẹo xử lý:</em> Hãy đối chiếu kỹ từng trường thông tin. Nếu phát hiện sai sót (ví dụ địa chỉ cũ chưa đổi hoặc sai lệch họ tên), bạn <strong>không nên gửi tờ khai ngay</strong> mà cần liên hệ Công an cấp xã để được cập nhật dữ liệu dân cư trước.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lưu ý 2 */}
              <div className={`p-4 rounded-2xl border ${highContrastMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm sm:text-base text-red-700 dark:text-red-400">
                      2. Cách nhập thông tin chủ hộ để xác nhận trên VNeID
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Đối với các thủ tục Cư trú (Đăng ký tạm trú, Thông báo lưu trú, Thường trú) hoặc người kê khai nộp hộ: Bạn bắt buộc phải nhập chính xác <strong>Số CCCD và Họ tên của Chủ hộ hoặc Chủ cơ sở cho thuê</strong>.
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 font-medium pt-1">
                      👉 <em>Quy trình xác nhận:</em> Sau khi bạn gửi yêu cầu, hệ thống sẽ tự động gửi thông báo phê duyệt đến ứng dụng VNeID mức độ 2 của Chủ hộ. Hãy nhắc Chủ hộ mở VNeID vào mục <strong>"Thông báo" / "Xác nhận cư trú"</strong> để bấm <strong>Đồng ý</strong>; khi đó hồ sơ mới chính thức được chuyển tới Công an xã/phường thụ lý.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lưu ý 3 */}
              <div className={`p-4 rounded-2xl border ${highContrastMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm sm:text-base text-red-700 dark:text-red-400">
                      3. Quy chuẩn ảnh chụp & tài liệu đính kèm rõ 4 góc
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Nguyên nhân phổ biến nhất khiến hồ sơ bị trả về là tài liệu đính kèm bị mờ, mất góc hoặc không đọc được số seri/dấu mộc đỏ.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 pt-1">
                      <li>Đặt giấy tờ trên mặt bàn phẳng, đủ ánh sáng tự nhiên, <strong>tuyệt đối không bật đèn flash</strong> gây lóa chữ.</li>
                      <li>Ảnh chụp phải <strong>thấy trọn vẹn cả 4 góc của trang giấy</strong>, không bị ngón tay che khuất nội dung.</li>
                      <li>Định dạng file cho phép: <strong>PDF, JPG, JPEG, PNG</strong>; dung lượng mỗi file dưới <strong>5MB</strong>.</li>
                      <li>Nếu tài liệu có nhiều trang (như Hợp đồng thuê nhà, Sổ đỏ), nên scan gộp thành 01 file PDF duy nhất.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Lưu ý 4 */}
              <div className={`p-4 rounded-2xl border ${highContrastMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm sm:text-base text-red-700 dark:text-red-400">
                      4. Cách theo dõi tiến độ & nhận kết quả điện tử
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Ngay sau khi nộp thành công, hệ thống sẽ cấp cho bạn một <strong>Mã hồ sơ điện tử</strong> (VD: H05.12-241018-0021).
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 pt-1">
                      <li>Theo dõi tiến độ tại mục <strong>"Dịch vụ công của tôi"</strong> trên VNeID hoặc tra cứu trên Cổng DVC Quốc gia.</li>
                      <li>Nếu cán bộ thụ lý yêu cầu bổ sung giấy tờ, bạn sẽ nhận được thông báo qua SMS và tin nhắn VNeID để bổ sung trực tuyến mà không cần đến trụ sở.</li>
                      <li>Kết quả giải quyết sẽ được cấp <strong>Bản điện tử có ký số xác thực</strong>, lưu trực tiếp trong ví giấy tờ VNeID và có giá trị pháp lý tương đương bản giấy.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 shrink-0">
              <a
                href={selectedProcedure.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-amber-400 hover:underline"
              >
                <span>Mở cổng nộp: {selectedProcedure.agency.split('(')[0]}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setIsVneidGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm shadow-sm transition"
              >
                Đã hiểu hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}