package com.koursekit.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentFilterService {
    private static final List<String> bannedWords = List.of(
            // English offensive words
            "2g1c", "4r5e", "5h1t", "5hit", "a55",
            "anal", "anus", "apeshit", "arse", "arsehole",
            "ass", "ass-fucker", "assbag", "assbandit", "assbanger",
            "assbite", "assclown", "asscock", "asscracker", "assface",
            "assfucker", "assgoblin", "asshat", "asshead", "asshole",
            "assholes", "assjacker", "asslick", "asslicker", "assmonkey",
            "assmunch", "asspirate", "assshole", "asssucker", "asswad",
            "asswhole", "asswipe",
            "b!tch", "b1tch", "bastard", "bitch", "bitcher",
            "bitches", "bitchin", "bitching", "bollocks", "boner",
            "bullshit", "bunghole",
            "c0ck", "c0cksucker", "cawk", "clusterfuck", "cnut",
            "cock", "cock-sucker", "cockbite", "cockburger", "cockface",
            "cockhead", "cockjockey", "cockmaster", "cockmonkey", "cockmunch",
            "cocknose", "cocks", "cocksucker", "cocksucking", "cok",
            "cokmuncher", "coksucka", "crap", "cum", "cumbubble",
            "cumdumpster", "cumguzzler", "cummer", "cumming", "cumshot",
            "cumslut", "cunt", "cuntface", "cunthole", "cuntlicker",
            "cuntrag", "cunts",
            "d1ck", "dammit", "dick", "dickbag", "dickface",
            "dickhead", "dickhole", "dicksucker", "dickwad", "dickweed",
            "dildo", "dipshit", "douche", "douchebag", "dumbshit",
            "dyke",
            "ejaculate", "ejaculation",
            "f u c k", "f_u_c_k", "fag", "fagbag", "fagg",
            "faggit", "faggot", "fags", "fagtard", "fart",
            "fatass", "fcuk", "fcuking", "feck", "felching",
            "fellatio", "fingerfuck", "fistfuck", "fisting", "fook",
            "fuck", "fucked", "fucker", "fuckers", "fuckhead",
            "fuckin", "fucking", "fuckme", "fucks", "fucktards",
            "fuckwit", "fuk", "fuker", "fukker", "fukkin",
            "gangbang", "gangbanged", "goddamn", "goddamned",
            "handjob", "hardcore", "homo", "hooker", "horny",
            "humping",
            "jackass", "jackoff", "jerk", "jizz",
            "knob", "knobhead", "kock", "kum", "kummer",
            "kumming", "kunt",
            "masterbate", "masturbate", "milf", "mofo", "mothafuck",
            "mothafucker", "motherfuck", "motherfucker", "motherfuckers", "motherfucking",
            "muff",
            "nude", "nudity", "nutsack",
            "orgasm", "orgy",
            "pecker", "pedophile", "penis", "phuck", "phuk",
            "piece of shit", "piss", "pissed", "pisser", "pissing",
            "pissoff", "porn", "porno", "pornography", "prick",
            "pricks", "pussy", "pussylicking",
            "rape", "raping", "rapist", "retard",
            "sadist", "scrotum", "semen", "sex", "shag",
            "shagging", "shemale", "shit", "shit-ass", "shit-bag",
            "shit-brain", "shit-face", "shit-head", "shit-hole", "shitass",
            "shitbag", "shitbrain", "shitface", "shitfaced", "shitfuck",
            "shithead", "shithole", "shitload", "shits", "shitted",
            "shitter", "shitting", "shitty", "skank", "slut",
            "slutbag", "sluts", "smut", "sodomize", "sodomy",
            "son-of-a-bitch", "spunk",
            "titfuck", "tits", "titties", "titty", "tittyfuck",
            "tosser", "twat", "twathead", "twatlips",
            "vagina", "vibrator", "vulva",
            "wank", "wanker", "whore",
            "xrated", "xxx",
            // Lebanese (Arabizi/watsapp lang - common offensive words)
            // Lebanese Arabizi - sexual/body
            "kuss", "ku55", "k3s", "k3ss", "kos", "kuss ummak", "kuss ukhtak",
            "ayre", "3yre", "aire", "ayri", "3ayri", "airi",
            "zibbi", "zibbi", "zibik", "zibek",
            "teez", "tiz",
            "sharmouta", "sharmou6a", "sharmuta", "char mouta",
            "sharamit",

            // Lebanese Arabizi - insults
            "manyek", "manyak", "manyok", "man1ak",
            "ahbal", "a7bal", "hmar", "7mar",
            "kalb", "kelb", "klb",
            "ibn el sharmouta", "ibn sharmouta", "ibn el sharamit",
            "ibn el metnak", "ibn el 3ars",
            "metnak", "met2anek",
            "3ars", "ars",
            "dayyous", "dayoos", "dayus",
            "khawal", "5awal",
            "lute", "loote",
            "fasiq",

            // Lebanese Arabizi - general insults
            "zbele", "zibele",
            "ta2 tizak", "ta2 tizzak",
            "bala tarbiye",
            "la2im", "la2een",
            "wiskh", "wasikh",
            "3abi", "3abeh",
            "ghanam", "3anzi",
            "flaneh", "flen"
    );

    public String filter(String comment){
        if (comment ==null)return null;
        //to detect when ppl are using special characters like "SH!t"
        String normalized = comment
            .replace("@", "a")
            .replace("$", "s")
            .replace("+", "t")
            .replace("!", "i");
        String filteredReview= comment;
            for (String word: bannedWords){
                String masked ="*".repeat(word.length());
                filteredReview=Pattern.compile(Pattern.quote(word), Pattern.CASE_INSENSITIVE).matcher(filteredReview).replaceAll(masked);

            }
            return filteredReview;
        }

}
