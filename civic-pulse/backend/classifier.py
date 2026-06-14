import re
 
CATEGORIES = {
    "Road": ["road","pothole","footpath","highway","street","traffic","signal",
             "divider","median","bridge","underpass","flyover","pavement"],
    "Water": ["water","pipe","leak","drain","drainage","flood","sewage","sewer",
              "overflow","blockage","tap","supply","borewell","puddle","waterlogging"],
    "Electricity": ["electricity","power","light","streetlight","transformer","wire",
                    "pole","outage","voltage","electric","bulb","cable"],
    "Garbage": ["garbage","trash","waste","dumping","litter","dustbin","bin",
                "rubbish","cleaning","sweeping","sanitation","filth","dirty"],
    "Park": ["park","garden","playground","tree","plant","grass","bench",
             "greenery","fountain","jogging","open space"],
    "Building": ["building","construction","demolition","structure","illegal",
                 "encroachment","wall","compound","property"],
    "Noise": ["noise","sound","loudspeaker","horn","disturbance","nuisance",
              "music","party","loud"],
}
 
def classify_complaint(text: str) -> str:
    if not text:
        return "Other"
    text_lower = text.lower()
    scores = {}
    for category, keywords in CATEGORIES.items():
        count = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', text_lower))
        if count > 0:
            scores[category] = count
    if not scores:
        return "Other"
    return max(scores, key=scores.get)