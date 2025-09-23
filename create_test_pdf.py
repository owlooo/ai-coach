from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def create_test_resume_pdf():
    # PDF 파일 생성
    doc = SimpleDocTemplate("test_resume.pdf", pagesize=letter)
    styles = getSampleStyleSheet()
    
    # 커스텀 스타일 정의
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=1  # 중앙 정렬
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=20
    )
    
    # 내용 작성
    story = []
    
    # 제목
    story.append(Paragraph("자기소개서", title_style))
    story.append(Spacer(1, 20))
    
    # 1. 지원동기
    story.append(Paragraph("1. 지원동기", heading_style))
    story.append(Paragraph("저는 AI 개발 분야에서 혁신적인 솔루션을 개발하고 싶어 지원하게 되었습니다. 대학에서 컴퓨터공학을 전공하며 다양한 프로젝트를 진행했고, 특히 머신러닝과 딥러닝에 대한 깊은 관심을 가지고 있습니다.", styles['Normal']))
    story.append(Spacer(1, 12))
    
    # 2. 성장과정
    story.append(Paragraph("2. 성장과정", heading_style))
    story.append(Paragraph("학부 시절부터 프로그래밍에 흥미를 가지고 있었으며, 알고리즘 동아리에서 활동하며 문제해결 능력을 기를 수 있었습니다. 또한 오픈소스 프로젝트에 기여하며 협업 능력과 코드 리뷰 경험을 쌓았습니다.", styles['Normal']))
    story.append(Spacer(1, 12))
    
    # 3. 경력사항
    story.append(Paragraph("3. 경력사항", heading_style))
    story.append(Paragraph("• 2022년: 삼성전자 인턴십 (3개월)<br/>• 2023년: 네이버 개발자 컨퍼런스 발표<br/>• 2024년: 개인 프로젝트로 AI 챗봇 개발", styles['Normal']))
    story.append(Spacer(1, 12))
    
    # 4. 장점 및 특기
    story.append(Paragraph("4. 장점 및 특기", heading_style))
    story.append(Paragraph("• Python, JavaScript, Java 등 다양한 프로그래밍 언어 숙련<br/>• TensorFlow, PyTorch 등 AI 프레임워크 경험<br/>• 팀워크와 커뮤니케이션 능력 우수<br/>• 지속적인 학습과 성장에 대한 의지", styles['Normal']))
    story.append(Spacer(1, 12))
    
    # 5. 입사 후 포부
    story.append(Paragraph("5. 입사 후 포부", heading_style))
    story.append(Paragraph("입사 후에는 회사의 AI 기술 발전에 기여하고, 사용자 중심의 혁신적인 제품을 개발하고 싶습니다. 또한 팀원들과의 협업을 통해 더욱 성장하고, 미래의 AI 기술 리더가 되고 싶습니다.", styles['Normal']))
    
    # PDF 생성
    doc.build(story)
    print("test_resume.pdf 파일이 생성되었습니다.")

if __name__ == "__main__":
    create_test_resume_pdf()

