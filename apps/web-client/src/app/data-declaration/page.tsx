import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Khai báo dữ liệu | CMC Network',
  description: 'Danh mục dữ liệu, mục đích, phạm vi chia sẻ và thời hạn lưu giữ tại CMC Network.',
};

export default function DataDeclarationPage() {
  return (
    <LegalPage
      currentPath="/data-declaration"
      title="Khai báo dữ liệu"
      description="Bản khai báo tóm tắt các nhóm dữ liệu CMC Network dự kiến xử lý. Nội dung này bổ sung cho Chính sách bảo mật và giúp bạn hiểu dữ liệu gắn với từng tính năng."
    >
      <section>
        <h2>1. Nguyên tắc chung</h2>
        <ul>
          <li>Chỉ thu thập dữ liệu cần cho mục đích rõ ràng và chức năng đang cung cấp.</li>
          <li>Không bán dữ liệu cá nhân.</li>
          <li>Không dùng dữ liệu nhạy cảm cho quảng cáo nhắm mục tiêu.</li>
          <li>Giới hạn quyền truy cập theo vai trò và ghi nhận hoạt động quản trị quan trọng.</li>
          <li>Thông báo và xin đồng ý riêng trước khi bổ sung mục đích xử lý không tương thích.</li>
        </ul>
      </section>

      <section>
        <h2>2. Danh mục dữ liệu</h2>
        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Nhóm</th><th>Ví dụ</th><th>Mục đích</th><th>Lưu giữ dự kiến</th></tr></thead>
            <tbody>
              <tr><td>Tài khoản</td><td>Email, họ tên, mật khẩu băm, OTP, ID tài khoản</td><td>Đăng ký, xác thực, khôi phục và bảo vệ tài khoản</td><td>Trong vòng đời tài khoản; log xác thực theo chu kỳ bảo mật</td></tr>
              <tr><td>Hồ sơ</td><td>Ảnh, ngày sinh, giới tính, ngành, khóa, kỹ năng, portfolio</td><td>Hiển thị danh tính và kết nối cộng đồng</td><td>Đến khi bạn sửa, xóa hoặc xóa tài khoản</td></tr>
              <tr><td>Nội dung xã hội</td><td>Bài viết, bình luận, cảm xúc, story, bookmark, báo cáo</td><td>Cung cấp feed, tương tác và kiểm duyệt</td><td>Đến khi nội dung bị xóa; bản ghi kiểm duyệt có thể giữ lâu hơn</td></tr>
              <tr><td>Chat và cuộc gọi</td><td>Tin nhắn, tệp, thành viên, thời gian, trạng thái đã đọc, metadata cuộc gọi</td><td>Truyền thông thời gian thực, đồng bộ và chống lạm dụng</td><td>Đến khi người dùng xóa hoặc theo chính sách hội thoại; log kỹ thuật ngắn hơn</td></tr>
              <tr><td>Học tập</td><td>Nhóm, sự kiện, lịch, điểm số hoặc dữ liệu học vụ bạn nhập</td><td>Tổ chức hoạt động học tập và hiển thị tiến trình</td><td>Trong vòng đời tài khoản hoặc đến khi mục tương ứng bị xóa</td></tr>
              <tr><td>Tài liệu và AI</td><td>File PDF, văn bản trích xuất, prompt, câu trả lời, tóm tắt, quiz</td><td>Lưu tài liệu, tìm kiếm và tạo nội dung học tập</td><td>Đến khi tài liệu/kết quả bị xóa; bản tạm phải được dọn theo chu kỳ vận hành</td></tr>
              <tr><td>Marketplace</td><td>Tin đăng, ảnh, giá, trạng thái, tin nhắn giao dịch</td><td>Đăng bán, tìm kiếm, liên hệ và xử lý báo cáo</td><td>Đến khi tin bị xóa; dữ liệu tranh chấp giữ khi cần</td></tr>
              <tr><td>Thông báo</td><td>Loại thông báo, đối tượng, trạng thái đọc, tùy chọn email/push</td><td>Gửi và cá nhân hóa thông báo</td><td>Theo vòng đời thông báo và tùy chọn tài khoản</td></tr>
              <tr><td>Kỹ thuật và bảo mật</td><td>IP, user agent, cookie phiên, request ID, log lỗi và audit</td><td>Vận hành, chẩn đoán, chống gian lận và điều tra sự cố</td><td>Theo chu kỳ log được phê duyệt; kéo dài khi có sự cố hoặc nghĩa vụ pháp lý</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>Lưu ý:</strong> “Lưu giữ dự kiến” là nguyên tắc sản phẩm, chưa thay thế lịch lưu giữ nội bộ. Trước khi phát hành chính thức, đơn vị vận hành phải xác lập số ngày/tháng cụ thể cho log, backup, OTP, nội dung đã xóa và dữ liệu nhà cung cấp.</p>
      </section>

      <section>
        <h2>3. Dữ liệu bắt buộc và tự nguyện</h2>
        <p>Email đủ điều kiện, họ tên, mật khẩu hoặc thông tin SSO và dữ liệu xác thực là cần thiết để tạo tài khoản. Dữ liệu hồ sơ mở rộng, nội dung đăng, tài liệu, dữ liệu marketplace và tùy chọn cá nhân là tự nguyện; không cung cấp có thể khiến tính năng liên quan không hoạt động.</p>
      </section>

      <section>
        <h2>4. Quyền truy cập theo đối tượng</h2>
        <ul>
          <li><strong>Công khai hoặc cộng đồng:</strong> dữ liệu bạn chủ động công khai như tên, ảnh, hồ sơ và bài viết theo cài đặt hiển thị.</li>
          <li><strong>Thành viên được chọn:</strong> tin nhắn, nhóm kín, tệp và nội dung giới hạn theo quyền truy cập.</li>
          <li><strong>Quản trị viên được ủy quyền:</strong> dữ liệu cần để hỗ trợ, kiểm duyệt, bảo mật và xử lý khiếu nại.</li>
          <li><strong>Nhà cung cấp:</strong> phần dữ liệu tối thiểu cần cho hạ tầng, email, SSO, cuộc gọi, lưu trữ hoặc AI.</li>
          <li><strong>Cơ quan có thẩm quyền:</strong> dữ liệu theo yêu cầu hợp pháp và đúng phạm vi.</li>
        </ul>
      </section>

      <section>
        <h2>5. Nhà cung cấp và điểm xử lý cần công bố</h2>
        <p>Kiến trúc hiện hỗ trợ hoặc dự kiến hỗ trợ Microsoft SSO, SMTP email, LiveKit/WebRTC, lưu trữ tệp và API AI tương thích OpenAI. Tên nhà cung cấp thực tế có thể thay đổi theo cấu hình triển khai.</p>
        <p>Trước production, đơn vị vận hành phải duy trì danh sách nhà xử lý gồm tên, dịch vụ, loại dữ liệu, quốc gia xử lý, thời hạn giữ và cơ chế xóa. Không đưa secret, token hoặc thông tin hạ tầng nhạy cảm vào danh sách công khai.</p>
      </section>

      <section>
        <h2>6. Dữ liệu nhạy cảm</h2>
        <p>CMC Network không yêu cầu người dùng đăng công khai dữ liệu sức khỏe, tài chính, giấy tờ định danh, sinh trắc học, quan điểm chính trị, tôn giáo hoặc đời sống riêng tư nhạy cảm. Nếu một tính năng tương lai cần loại dữ liệu này, phải có đánh giá tác động, bảo vệ tăng cường và cơ chế đồng ý riêng trước khi thu thập.</p>
      </section>

      <section>
        <h2>7. Quyết định tự động và AI</h2>
        <p>AI được dùng để hỗ trợ xử lý tài liệu và tạo nội dung học tập. Kết quả không nên tự động quyết định quyền học tập, kỷ luật, tuyển dụng, tín dụng hoặc quyền lợi quan trọng. Các quyết định có tác động đáng kể phải có người có thẩm quyền xem xét.</p>
        <p>Không nhập bí mật, mật khẩu, dữ liệu định danh nhạy cảm hoặc tài liệu không có quyền sử dụng vào tính năng AI.</p>
      </section>

      <section>
        <h2>8. Xóa, xuất và sửa dữ liệu</h2>
        <p>Bạn có thể sửa thông tin qua Hồ sơ hoặc Cài đặt và xóa nội dung bằng chức năng tương ứng khi có. Yêu cầu xuất hoặc xóa toàn bộ dữ liệu được gửi qua kênh hỗ trợ chính thức. Danh tính có thể được xác minh và một số dữ liệu có thể được giữ để đáp ứng nghĩa vụ pháp lý, chống gian lận hoặc giải quyết tranh chấp.</p>
      </section>

      <section>
        <h2>9. Sao lưu và bản sao</h2>
        <p>Dữ liệu đã xóa có thể tồn tại tạm thời trong backup có kiểm soát cho đến khi hết chu kỳ ghi đè. Backup không được dùng để khôi phục riêng dữ liệu đã xóa, trừ nhu cầu phục hồi thảm họa hoặc nghĩa vụ pháp lý; khi phục hồi toàn hệ thống, yêu cầu xóa phải được áp dụng lại.</p>
      </section>

      <section>
        <h2>10. Kiểm soát trước phát hành</h2>
        <p>Khai báo này chỉ chính xác khi phản ánh cấu hình production. Mỗi lần thêm trường dữ liệu, analytics, SDK, nhà cung cấp, mục đích xử lý hoặc thay đổi thời hạn lưu giữ, nhóm phát triển phải cập nhật tài liệu, đánh giá bảo mật và xem xét việc xin đồng ý lại.</p>
      </section>

      <section>
        <h2>11. Liên hệ</h2>
        <p>Câu hỏi về dữ liệu được gửi qua kênh hỗ trợ chính thức trên tên miền cmcnetwork.io.vn. Đơn vị vận hành cần bổ sung pháp nhân kiểm soát dữ liệu, đầu mối bảo vệ dữ liệu và lịch lưu giữ định lượng trước khi công bố bản pháp lý chính thức.</p>
      </section>
    </LegalPage>
  );
}
