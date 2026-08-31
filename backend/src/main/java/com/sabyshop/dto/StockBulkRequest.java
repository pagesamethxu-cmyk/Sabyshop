package com.sabyshop.dto;
import lombok.Data;
import java.util.List;
@Data
public class StockBulkRequest {
    private List<StockRequest> items;
}
