package com.digitalpaper.email.util;


public final class DurationLabels {

    private DurationLabels() {}

    public static String fromMinutes(long minutes) {
        if (minutes >= 60 && minutes % 60 == 0) {
            long hours = minutes / 60;
            return hours == 1 ? "1 hora" : hours + " horas";
        }
        return minutes == 1 ? "1 minuto" : minutes + " minutos";
    }

}
