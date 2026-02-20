package com.koursekit.service;

import org.springframework.stereotype.Service;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentFilterService {
    private static final List<String> bannedWords = List.of(
            // English offensive words
            // English - strong profanity
            "fuck", "fuk", "f*ck", "fuck", "fvck", "f**k",
            "shit", "sh1t", "sh*t",
            "bitch", "b1tch", "b*tch", "biatch",
            "asshole", "a**hole", "azzhole",
            "bastard", "basterd",
            "cunt", "c*nt",
            "dick", "d1ck", "d*ck",
            "cock", "c0ck",
            "pussy", "p*ssy",
            "whore", "wh*re", "w**re",
            "slut", "sl*t",
            "prick",
            "twat",
            "wanker",
            "jackass", "jack ass",
            "douchebag", "douche",
            "motherfucker", "motherf*cker", "mofo",
            "son of a bitch", "son of a b*tch",
            "go to hell",
            "piece of shit", "piece of crap",

// English - mild but commonly filtered
            "crap",
            "damn", "dammit", "goddamn",
            "hell",
            "ass", "a**",
            "bollocks",
            "bugger",
            "bloody hell",

// English - insults/slurs
            "idiot", "stupid", "moron",
            "retard", "retarded",
            "imbecile",
            "dumbass", "dumb ass",
            "loser",
            "scumbag",
            "creep",
            "pervert", "perv",
            "freak",
            "jerk",
            "piss off", "piss",
            "screw you",
            "shut up",
            "go fuck yourself",
            "kiss my ass",
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
        String filteredReview= comment;
        for (String word: bannedWords){
            String masked ="*".repeat(word.length());
            filteredReview=Pattern.compile(Pattern.quote(word), Pattern.CASE_INSENSITIVE).matcher(filteredReview).replaceAll(masked);

        }
        return filteredReview;
    }

}
