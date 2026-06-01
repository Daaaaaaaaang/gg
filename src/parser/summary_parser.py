import re


def clean_text(text):
    if not text:
        return ""
    text = str(text)
    text = text.replace("\\n", " ").replace("\\,", ",").replace("\\;", ";")
    return text.replace("\r", "").strip()


def parse_summary(summary, description):
    phone_pat = re.compile(r"0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4}")
    phone_m = phone_pat.search(summary)
    phone = phone_m.group().strip() if phone_m else ""
    s = summary
    if phone:
        s = s.replace(phone_m.group(), "").strip(" .,")
    model_m = re.match(r"^([A-Z]\d+[a-z]*d?)", s)
    model = model_m.group(1) if model_m else ""
    if model:
        s = s[len(model):].lstrip(".")
    plate_m = re.search(r"\d{2,3}[가-힣]\d{4}|\d{3,4}[가-힣]{1,2}\d{4}|[가-힣]{2}\d{4}", s)
    plate = plate_m.group().strip() if plate_m else ""
    title = s.replace(plate, "") if plate else s
    # 번호판 직후(앞 2자 이내)에 붙은 괄호만 지역명으로 간주해 제거, 이후 괄호는 유지
    title = re.sub(r"^([\s.,\-]{0,2})[(（][^)）\n]{1,10}[)）]", r"\1", title)
    title = re.sub(r"^[\s.,\-]+", "", title)
    title = re.sub(r"[\s.,\-]+$", "", title)
    title = re.sub(r"\s{2,}", " ", title).strip()
    note = clean_text(description)
    return model, plate, "", "", title, note
