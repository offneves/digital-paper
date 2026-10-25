package com.digitalpaper.email.util;

import java.util.regex.Pattern;


public final class HtmlToText {

    private static final Pattern HEAD = Pattern.compile("(?is)<head.*?</head>");
    private static final Pattern HIDDEN = Pattern.compile("(?is)<[^>]+data-text-skip[^>]*>.*?</[^>]+>");
    private static final Pattern LINK = Pattern.compile("(?is)<a\\s[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>");
    private static final Pattern BREAK = Pattern.compile("(?i)<br\\s*/?>|</(p|div|tr|h[1-6]|li|table)>");
    private static final Pattern TAG = Pattern.compile("<[^>]+>");
    private static final Pattern SPACES = Pattern.compile("[ \\t\\x0B\\f\\r]+");
    private static final Pattern BLANK_LINES = Pattern.compile("\\n\\s*\\n\\s*(\\n\\s*)+");

    private HtmlToText() {}

    public static String convert(String html) {
        String text = HEAD.matcher(html).replaceAll("");
        text = HIDDEN.matcher(text).replaceAll("");
        text = LINK.matcher(text).replaceAll(match -> {
            String label = TAG.matcher(match.group(2)).replaceAll("").trim();
            String url = match.group(1);
            String value = label.isEmpty() || label.equals(url) ? url : label + ": " + url;
            return java.util.regex.Matcher.quoteReplacement(value);
        });
        text = BREAK.matcher(text).replaceAll("\n");
        text = TAG.matcher(text).replaceAll("");
        text = text
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .replace("&mdash;", "—");
        text = SPACES.matcher(text).replaceAll(" ");
        text = text.lines().map(String::strip).reduce((a, b) -> a + "\n" + b).orElse("");
        return BLANK_LINES.matcher(text).replaceAll("\n\n").strip();
    }

}
