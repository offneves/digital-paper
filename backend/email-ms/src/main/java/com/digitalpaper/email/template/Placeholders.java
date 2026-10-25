package com.digitalpaper.email.template;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.springframework.web.util.HtmlUtils;


public final class Placeholders {

    public static final Pattern VARIABLE = Pattern.compile("\\{\\{\\s*([a-zA-Z][a-zA-Z0-9_]*)\\s*\\}\\}");
    private static final Pattern BOLD = Pattern.compile("\\*\\*(.+?)\\*\\*");
    private static final Pattern PARAGRAPH_BREAK = Pattern.compile("\\r?\\n\\s*\\r?\\n");

    private Placeholders() {}

    public static String text(String template, Map<String, String> variables) {
        if (template == null || template.isBlank()) {
            return null;
        }
        Matcher matcher = VARIABLE.matcher(template);
        return matcher.replaceAll(match -> Matcher.quoteReplacement(
            Objects.requireNonNullElse(variables.get(match.group(1)), "")
        )).trim();
    }

    public static String html(String template, Map<String, String> variables) {
        String value = text(template, variables);
        if (value == null) {
            return null;
        }
        String escaped = HtmlUtils.htmlEscape(value, "UTF-8");
        String bold = BOLD.matcher(escaped).replaceAll("<strong>$1</strong>");
        return bold.replaceAll("\\r?\\n", "<br>");
    }

    public static List<String> paragraphs(String template, Map<String, String> variables) {
        if (template == null || template.isBlank()) {
            return List.of();
        }
        return PARAGRAPH_BREAK.splitAsStream(template.strip())
            .map(paragraph -> html(paragraph, variables))
            .filter(paragraph -> paragraph != null && !paragraph.isBlank())
            .toList();
    }

    public static Set<String> extract(String... templates) {
        Set<String> found = new LinkedHashSet<>();
        Stream.of(templates)
            .filter(Objects::nonNull)
            .forEach(template -> {
                Matcher matcher = VARIABLE.matcher(template);
                while (matcher.find()) {
                    found.add(matcher.group(1));
                }
            });
        return found;
    }

    public static List<String> split(String variables) {
        if (variables == null || variables.isBlank()) {
            return List.of();
        }
        return Arrays.stream(variables.split(","))
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .toList();
    }

}
