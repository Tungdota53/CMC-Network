import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng | CMC Network',
  description: 'Quy tắc và điều kiện sử dụng nền tảng CMC Network.',
};

export default function TermsPage() {
  return (
    <LegalPage
      currentPath="/terms"
      title="Điều khoản sử dụng"
      description="Điều khoản này điều chỉnh việc truy cập và sử dụng CMC Network. Khi tạo tài khoản, bạn xác nhận đã đọc, hiểu và đồng ý tuân thủ các điều khoản dưới đây."
    >
      <section>
        <h2>1. Chấp nhận điều khoản</h2>
        <p>Bằng việc đăng ký hoặc sử dụng CMC Network, bạn đồng ý với Điều khoản sử dụng, Chính sách bảo mật, Khai báo dữ liệu và quy tắc cộng đồng được công bố. Nếu không đồng ý, không tạo tài khoản hoặc ngừng sử dụng dịch vụ.</p>
        <p>Nếu bạn chưa đủ tuổi tự giao kết theo pháp luật áp dụng, bạn xác nhận đã có sự đồng ý hợp lệ của cha mẹ hoặc người giám hộ.</p>
      </section>

      <section>
        <h2>2. Phạm vi dịch vụ</h2>
        <p>CMC Network cung cấp công cụ kết nối cộng đồng, hồ sơ, bài viết, nhóm học, sự kiện, tài liệu, tính năng AI, trò chuyện, cuộc gọi và marketplace. Tính năng có thể ở trạng thái thử nghiệm, thay đổi, tạm ngừng hoặc bị loại bỏ để bảo mật, bảo trì hoặc cải thiện sản phẩm.</p>
        <p>CMC Network không đại diện cho thông báo học vụ chính thức trừ khi nội dung được đánh dấu rõ là phát hành bởi đơn vị có thẩm quyền.</p>
      </section>

      <section>
        <h2>3. Tài khoản và bảo mật</h2>
        <ul>
          <li>Cung cấp thông tin chính xác, cập nhật và chỉ tạo tài khoản mà bạn có quyền sử dụng.</li>
          <li>Giữ bí mật mật khẩu, mã OTP và phiên đăng nhập; không bán, cho thuê hoặc chuyển giao tài khoản.</li>
          <li>Chịu trách nhiệm về hoạt động thực hiện qua tài khoản cho đến khi thông báo sự cố và hoàn tất biện pháp bảo vệ cần thiết.</li>
          <li>Không giả mạo cá nhân, tổ chức, sinh viên, giảng viên hoặc quản trị viên.</li>
        </ul>
      </section>

      <section>
        <h2>4. Quy tắc sử dụng</h2>
        <p>Bạn không được:</p>
        <ul>
          <li>Đăng nội dung trái pháp luật, lừa đảo, quấy rối, đe dọa, thù ghét, khiêu dâm, xâm phạm danh dự, quyền riêng tư hoặc quyền sở hữu trí tuệ.</li>
          <li>Phát tán mã độc, spam, nội dung thao túng, liên kết lừa đảo hoặc thu thập dữ liệu người khác khi chưa có quyền.</li>
          <li>Vượt qua xác thực, kiểm soát truy cập, giới hạn tốc độ; dò quét, khai thác lỗ hổng hoặc gây gián đoạn hệ thống.</li>
          <li>Dùng bot, scraper hoặc công cụ tự động ngoài API được cho phép.</li>
          <li>Dùng AI để gian lận học tập, tạo nội dung vi phạm, xâm phạm quyền của người khác hoặc đưa ra quyết định có tác động nghiêm trọng mà không có kiểm tra của con người.</li>
          <li>Mua bán hàng hóa bị cấm, hàng giả, dịch vụ gian lận hoặc giao dịch ngoài phạm vi pháp luật.</li>
        </ul>
      </section>

      <section>
        <h2>5. Nội dung của người dùng</h2>
        <p>Bạn giữ quyền đối với nội dung mình tạo và chịu trách nhiệm về tính hợp pháp, chính xác, quyền sử dụng và quyền công bố nội dung đó.</p>
        <p>Bạn cấp cho CMC Network giấy phép không độc quyền, có thể sử dụng trên toàn cầu, miễn phí bản quyền và giới hạn trong thời gian nội dung còn trên dịch vụ để lưu trữ, sao chép, truyền tải, định dạng, hiển thị và phân phối nội dung nhằm vận hành, bảo mật và cải thiện tính năng bạn sử dụng. Giấy phép chấm dứt khi nội dung được xóa khỏi hệ thống hoạt động, trừ bản sao lưu, nghĩa vụ pháp lý hoặc nội dung đã được người khác chia sẻ hợp lệ.</p>
      </section>

      <section>
        <h2>6. Tài liệu, AI và nội dung tạo tự động</h2>
        <p>Bạn chỉ tải lên tài liệu khi có quyền. Dữ liệu đầu vào có thể được gửi đến nhà cung cấp AI được cấu hình để tạo tóm tắt, flashcard, quiz hoặc câu trả lời.</p>
        <p>Kết quả AI có thể sai, thiếu, thiên lệch hoặc không cập nhật. Bạn phải kiểm tra nguồn gốc và tính chính xác trước khi dùng. Kết quả AI không phải tư vấn pháp lý, y tế, tài chính, học vụ chính thức hoặc cam kết của Đại học CMC.</p>
      </section>

      <section>
        <h2>7. Marketplace và giao dịch giữa người dùng</h2>
        <p>CMC Network cung cấp nơi đăng và tìm thông tin sản phẩm; không mặc nhiên là người bán, người mua, trung gian thanh toán hay bên bảo đảm giao dịch. Các bên tự xác minh sản phẩm, danh tính, giá, phương thức giao nhận và nghĩa vụ thuế. Hãy báo cáo dấu hiệu lừa đảo và không chuyển tiền khi chưa xác minh.</p>
      </section>

      <section>
        <h2>8. Sở hữu trí tuệ của nền tảng</h2>
        <p>Phần mềm, giao diện, nhãn hiệu, logo, thiết kế và nội dung do CMC Network cung cấp thuộc chủ sở hữu tương ứng. Điều khoản không chuyển giao quyền sở hữu. Bạn không được sao chép, sửa đổi, bán, dịch ngược hoặc tạo sản phẩm phái sinh ngoài phạm vi pháp luật hoặc giấy phép nguồn mở áp dụng.</p>
      </section>

      <section>
        <h2>9. Kiểm duyệt và xử lý vi phạm</h2>
        <p>CMC Network có thể dùng báo cáo người dùng và biện pháp tự động để phát hiện vi phạm; gỡ hoặc hạn chế nội dung; giảm khả năng phân phối; cảnh báo; khóa tính năng; đình chỉ hoặc chấm dứt tài khoản. Trong trường hợp phù hợp, bạn có thể yêu cầu xem xét lại qua kênh hỗ trợ.</p>
        <p>Vi phạm nghiêm trọng, nguy cơ an toàn hoặc yêu cầu hợp pháp có thể được chuyển cho Đại học CMC hoặc cơ quan có thẩm quyền theo quy định.</p>
      </section>

      <section>
        <h2>10. Dịch vụ bên thứ ba</h2>
        <p>Tính năng đăng nhập, email, cuộc gọi, lưu trữ hoặc AI có thể phụ thuộc dịch vụ bên thứ ba và điều khoản riêng của họ. CMC Network không kiểm soát website ngoài được liên kết và không chịu trách nhiệm cho nội dung, bảo mật hoặc giao dịch trên website đó.</p>
      </section>

      <section>
        <h2>11. Tạm ngừng và chấm dứt</h2>
        <p>Bạn có thể ngừng sử dụng và yêu cầu xóa tài khoản. CMC Network có thể tạm ngừng dịch vụ để bảo trì, xử lý sự cố, tuân thủ pháp luật hoặc bảo vệ cộng đồng. Tài khoản vi phạm điều khoản có thể bị hạn chế hoặc chấm dứt sau đánh giá phù hợp với mức độ và rủi ro.</p>
      </section>

      <section>
        <h2>12. Tuyên bố miễn trừ</h2>
        <p>Dịch vụ được cung cấp theo hiện trạng và khả năng sẵn có trong phạm vi pháp luật cho phép. Chúng tôi không bảo đảm dịch vụ luôn liên tục, không lỗi, mọi nội dung người dùng đều chính xác hoặc kết quả AI phù hợp cho một mục đích cụ thể.</p>
      </section>

      <section>
        <h2>13. Giới hạn trách nhiệm</h2>
        <p>Trong phạm vi pháp luật cho phép, CMC Network không chịu trách nhiệm cho thiệt hại gián tiếp, mất dữ liệu do hành vi người dùng, quyết định dựa trên nội dung người dùng hoặc AI, hay giao dịch trực tiếp giữa người dùng. Không nội dung nào trong điều khoản loại trừ trách nhiệm không thể loại trừ theo pháp luật.</p>
      </section>

      <section>
        <h2>14. Bồi hoàn</h2>
        <p>Trong phạm vi pháp luật cho phép, bạn chịu trách nhiệm đối với khiếu nại và thiệt hại phát sinh từ nội dung, giao dịch hoặc hành vi vi phạm pháp luật, quyền của bên thứ ba hay điều khoản này do mình thực hiện.</p>
      </section>

      <section>
        <h2>15. Luật áp dụng và giải quyết tranh chấp</h2>
        <p>Điều khoản được điều chỉnh bởi pháp luật Việt Nam. Các bên ưu tiên giải quyết tranh chấp bằng thương lượng thiện chí. Nếu không giải quyết được, tranh chấp được đưa đến cơ quan có thẩm quyền tại Việt Nam theo quy định pháp luật.</p>
      </section>

      <section>
        <h2>16. Thay đổi điều khoản</h2>
        <p>Phiên bản và ngày hiệu lực được hiển thị ở đầu trang. Thay đổi quan trọng sẽ được thông báo trước hoặc yêu cầu chấp thuận lại khi cần. Nếu không đồng ý phiên bản mới, bạn phải ngừng sử dụng và có thể yêu cầu xóa tài khoản.</p>
      </section>

      <section>
        <h2>17. Liên hệ và tính hoàn chỉnh</h2>
        <p>Yêu cầu liên quan điều khoản được gửi qua kênh hỗ trợ chính thức trên tên miền cmcnetwork.io.vn. Nếu một điều khoản không thể thi hành, phần còn lại vẫn có hiệu lực. Đơn vị vận hành cần bổ sung tên pháp nhân, địa chỉ và đầu mối giải quyết khiếu nại trước khi phát hành chính thức.</p>
      </section>
    </LegalPage>
  );
}
