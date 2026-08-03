import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật | CMC Network',
  description: 'Cách CMC Network thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      currentPath="/privacy"
      title="Chính sách bảo mật"
      description="Chính sách này giải thích cách CMC Network xử lý dữ liệu cá nhân khi bạn sử dụng website, ứng dụng và các tính năng cộng đồng của nền tảng."
    >
      <section>
        <h2>1. Phạm vi và đơn vị vận hành</h2>
        <p>Chính sách áp dụng cho CMC Network, nền tảng số dành cho cộng đồng sinh viên Đại học CMC, gồm mạng xã hội, hồ sơ, học tập, tài liệu, AI, trò chuyện, cuộc gọi, sự kiện và marketplace.</p>
        <p>CMC Network đang trong giai đoạn phát triển. Thông tin pháp nhân, địa chỉ và đầu mối bảo vệ dữ liệu chính thức phải được đơn vị sở hữu nền tảng công bố trước khi cung cấp dịch vụ thương mại hoặc mở rộng ra ngoài phạm vi thử nghiệm.</p>
      </section>

      <section>
        <h2>2. Dữ liệu chúng tôi thu thập</h2>
        <ul>
          <li><strong>Dữ liệu tài khoản:</strong> email trường, họ tên, mật khẩu đã băm, mã xác minh, trạng thái tài khoản và thông tin đăng nhập Microsoft nếu bạn dùng SSO.</li>
          <li><strong>Dữ liệu hồ sơ:</strong> ảnh đại diện, ảnh bìa, ngày sinh, giới tính, ngành học, khóa học, tiểu sử, kỹ năng, thành tích, portfolio và thông tin bạn tự nguyện cung cấp.</li>
          <li><strong>Nội dung và hoạt động:</strong> bài viết, bình luận, cảm xúc, lượt chia sẻ, bookmark, story, nhóm học, sự kiện, tài liệu, đánh giá, sản phẩm marketplace và báo cáo vi phạm.</li>
          <li><strong>Giao tiếp:</strong> nội dung tin nhắn, tệp đính kèm, thành viên cuộc trò chuyện, thời điểm gửi, trạng thái đã đọc và dữ liệu kỹ thuật cần để cung cấp cuộc gọi.</li>
          <li><strong>Dữ liệu học tập và AI:</strong> tài liệu tải lên, văn bản trích xuất, câu hỏi, câu trả lời, tóm tắt, flashcard, quiz và phản hồi liên quan.</li>
          <li><strong>Dữ liệu kỹ thuật:</strong> địa chỉ IP, loại thiết bị và trình duyệt, cookie phiên, log bảo mật, thời điểm truy cập, lỗi ứng dụng và thông tin chẩn đoán.</li>
        </ul>
      </section>

      <section>
        <h2>3. Mục đích và căn cứ xử lý</h2>
        <p>Chúng tôi xử lý dữ liệu để tạo và bảo vệ tài khoản; cung cấp tính năng bạn yêu cầu; cá nhân hóa nội dung; gửi thông báo; vận hành chat, cuộc gọi và AI; ngăn gian lận, spam, lạm dụng; hỗ trợ người dùng; phân tích và cải thiện hệ thống; tuân thủ yêu cầu pháp luật.</p>
        <p>Tùy hoạt động, việc xử lý dựa trên yêu cầu thực hiện dịch vụ theo Điều khoản sử dụng, sự đồng ý của bạn, lợi ích hợp pháp trong bảo mật và cải thiện nền tảng, hoặc nghĩa vụ pháp lý áp dụng. Bạn có thể rút lại sự đồng ý cho xử lý dựa trên đồng ý; việc rút lại không ảnh hưởng tính hợp pháp của xử lý trước đó.</p>
      </section>

      <section>
        <h2>4. Cookie và phiên đăng nhập</h2>
        <p>CMC Network dùng cookie hoặc công nghệ tương tự cần thiết để duy trì phiên, xác thực, bảo mật và ghi nhớ tùy chọn giao diện. Không nên dùng cookie quảng cáo hoặc theo dõi đa nền tảng nếu chưa có thông báo và cơ chế đồng ý riêng.</p>
      </section>

      <section>
        <h2>5. Chia sẻ và bên xử lý dữ liệu</h2>
        <p>Dữ liệu có thể được xử lý bởi nhà cung cấp hạ tầng, lưu trữ, email, đăng nhập Microsoft, hội nghị thời gian thực và dịch vụ AI theo cấu hình vận hành. Chúng tôi chỉ chia sẻ phần dữ liệu cần thiết để cung cấp chức năng, bảo mật hệ thống, tuân thủ pháp luật hoặc xử lý yêu cầu hợp lệ.</p>
        <p>Nội dung bạn đặt ở chế độ công khai có thể được thành viên khác xem, sao chép hoặc chia sẻ. Không đăng mật khẩu, giấy tờ định danh, dữ liệu tài chính, hồ sơ sức khỏe hoặc thông tin bí mật vào vùng công khai.</p>
      </section>

      <section>
        <h2>6. Chuyển dữ liệu xuyên biên giới</h2>
        <p>Một số nhà cung cấp hạ tầng hoặc AI có thể xử lý dữ liệu tại quốc gia khác. Trước khi kích hoạt nhà cung cấp như vậy, đơn vị vận hành phải đánh giá phạm vi dữ liệu, vị trí xử lý, điều khoản bảo vệ dữ liệu và thực hiện thủ tục cần thiết theo pháp luật Việt Nam.</p>
      </section>

      <section>
        <h2>7. Lưu giữ và xóa dữ liệu</h2>
        <p>Dữ liệu được giữ trong thời gian cần để duy trì tài khoản, cung cấp dịch vụ, giải quyết tranh chấp, ngăn lạm dụng và đáp ứng nghĩa vụ pháp lý. Thời hạn cụ thể phụ thuộc loại dữ liệu và được mô tả tại Khai báo dữ liệu.</p>
        <p>Khi tài khoản bị xóa, dữ liệu sẽ được xóa hoặc ẩn danh theo quy trình kỹ thuật và chu kỳ sao lưu, trừ phần phải giữ do nghĩa vụ pháp lý, bảo mật hoặc tranh chấp. Nội dung đã được người khác chia sẻ lại có thể không biến mất khỏi bản sao do người đó kiểm soát.</p>
      </section>

      <section>
        <h2>8. Bảo mật</h2>
        <p>CMC Network áp dụng kiểm soát truy cập, mật khẩu băm, mã hóa đường truyền, giới hạn truy cập nội bộ, log bảo mật, sao lưu và biện pháp kỹ thuật phù hợp. Không hệ thống nào an toàn tuyệt đối. Người dùng phải giữ bí mật thông tin đăng nhập và báo ngay khi nghi ngờ tài khoản bị truy cập trái phép.</p>
      </section>

      <section>
        <h2>9. Quyền của bạn</h2>
        <p>Trong phạm vi pháp luật cho phép, bạn có thể yêu cầu biết, truy cập, chỉnh sửa, hạn chế xử lý, phản đối, rút lại đồng ý, nhận bản sao hoặc xóa dữ liệu cá nhân; đồng thời có quyền khiếu nại về cách dữ liệu được xử lý. Chúng tôi có thể xác minh danh tính trước khi thực hiện yêu cầu.</p>
        <p>Một số thao tác có thể thực hiện trong Hồ sơ và Cài đặt. Với yêu cầu chưa có chức năng tự phục vụ, dùng kênh hỗ trợ chính thức được công bố trên website. Không gửi dữ liệu nhạy cảm đến địa chỉ email không được xác minh.</p>
      </section>

      <section>
        <h2>10. Người chưa thành niên</h2>
        <p>Nền tảng hướng tới sinh viên. Nếu người dùng chưa đủ tuổi tự mình đồng ý theo pháp luật áp dụng, người dùng cần sự đồng ý của cha mẹ hoặc người giám hộ. Khi phát hiện dữ liệu trẻ em được thu thập không hợp lệ, đơn vị vận hành sẽ hạn chế hoặc xóa dữ liệu đó.</p>
      </section>

      <section>
        <h2>11. Sự cố dữ liệu</h2>
        <p>Khi xảy ra sự cố ảnh hưởng dữ liệu cá nhân, CMC Network sẽ điều tra, hạn chế tác động, khắc phục và thông báo cho chủ thể dữ liệu hoặc cơ quan có thẩm quyền khi pháp luật yêu cầu.</p>
      </section>

      <section>
        <h2>12. Thay đổi chính sách</h2>
        <p>Phiên bản mới sẽ hiển thị ngày hiệu lực. Nếu thay đổi ảnh hưởng đáng kể đến quyền của bạn, chúng tôi sẽ thông báo phù hợp và yêu cầu đồng ý lại khi cần. Việc tiếp tục dùng dịch vụ không thay thế sự đồng ý rõ ràng trong trường hợp pháp luật bắt buộc.</p>
      </section>

      <section>
        <h2>13. Liên hệ</h2>
        <p>Yêu cầu về quyền riêng tư được gửi qua kênh hỗ trợ chính thức trên tên miền cmcnetwork.io.vn. Đơn vị vận hành cần bổ sung tên pháp nhân, địa chỉ liên hệ và đầu mối bảo vệ dữ liệu trước khi văn bản này được coi là bản phát hành pháp lý chính thức.</p>
      </section>
    </LegalPage>
  );
}
