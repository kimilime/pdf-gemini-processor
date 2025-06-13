#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票年报下载工具 v2.0
改进版本，更稳定的数据源和错误处理

使用方法:
python downloader.py 000001 2022
python downloader.py -f codes.txt -y 2020-2022
"""

import os
import sys
import re
import time
import json
import argparse
import requests
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, quote
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

class StockReportDownloader:
    def __init__(self, download_dir="annual_reports"):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(exist_ok=True)
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
    
    def detect_market(self, stock_code):
        """检测股票市场"""
        code = re.sub(r'[^\d]', '', stock_code)
        
        if len(code) == 6:
            return 'A股'
        elif len(code) in [4, 5]:
            return '港股'
        else:
            return 'A股'
    
    def download_a_stock_report(self, stock_code, year):
        """下载A股年报 - 改进版"""
        logger.info(f"下载A股 {stock_code} {year}年年报...")
        
        try:
            # 方法1: 巨潮资讯网新接口
            result = self._try_cninfo_new_api(stock_code, year)
            if result:
                return result
            
            # 方法2: 备用搜索方法
            result = self._try_cninfo_search(stock_code, year)
            if result:
                return result
                
            # 方法3: 东方财富备用接口
            result = self._try_eastmoney_api(stock_code, year)
            if result:
                return result
            
            return {'status': 'not_found', 'message': f'所有方法都未找到{year}年年报'}
            
        except Exception as e:
            logger.error(f"A股下载异常: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    def _try_cninfo_new_api(self, stock_code, year):
        """尝试巨潮资讯网新API"""
        try:
            # 新的API接口，带更完整的参数
            url = "http://www.cninfo.com.cn/new/hisAnnouncement/query"
            
            # 更完整的参数设置
            data = {
                "stock": stock_code,
                "searchkey": "",
                "plate": "",
                "category": "category_ndbg_szsh",
                "trade": "",
                "column": "szse_main",
                "columnTitle": "历史公告查询", 
                "pageNum": 1,
                "pageSize": 50,
                "tabName": "fulltext",
                "sortName": "",
                "sortType": "",
                "limit": "",
                "showTitle": "",
                "seDate": f"{year}-01-01~{year+1}-06-30"
            }
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'http://www.cninfo.com.cn/new/disclosure/stock',
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            }
            
            response = self.session.post(url, data=data, headers=headers, timeout=30)
            
            # 检查响应内容
            logger.debug(f"响应状态码: {response.status_code}")
            logger.debug(f"响应内容前200字符: {response.text[:200]}")
            
            if response.status_code != 200:
                return None
                
            # 尝试解析JSON
            try:
                result = response.json()
            except json.JSONDecodeError:
                logger.warning("响应不是有效的JSON格式")
                return None
            
            if not result.get('announcements'):
                logger.info("未找到公告列表")
                return None
            
            # 查找年报
            for announcement in result['announcements']:
                title = announcement.get('announcementTitle', '')
                if self._is_annual_report(title, year):
                    pdf_url = f"http://static.cninfo.com.cn/{announcement['adjunctUrl']}"
                    filename = f"A股_{stock_code}_{year}年年度报告.pdf"
                    
                    if self._download_pdf(pdf_url, filename):
                        return {'status': 'success', 'filename': filename}
            
            return None
            
        except Exception as e:
            logger.debug(f"巨潮新API失败: {e}")
            return None
    
    def _try_cninfo_search(self, stock_code, year):
        """尝试巨潮搜索页面"""
        try:
            # 通过搜索页面获取
            search_url = f"http://www.cninfo.com.cn/new/disclosure/stock?orgId={stock_code}&stockCode={stock_code}"
            
            response = self.session.get(search_url, timeout=30)
            
            if "年度报告" in response.text and str(year) in response.text:
                # 简单模式：从页面内容中提取PDF链接
                pdf_pattern = r'href="([^"]*\.pdf)"[^>]*>[^<]*' + str(year) + r'[^<]*年度报告'
                matches = re.findall(pdf_pattern, response.text, re.IGNORECASE)
                
                if matches:
                    pdf_url = urljoin("http://www.cninfo.com.cn", matches[0])
                    filename = f"A股_{stock_code}_{year}年年度报告.pdf"
                    
                    if self._download_pdf(pdf_url, filename):
                        return {'status': 'success', 'filename': filename}
            
            return None
            
        except Exception as e:
            logger.debug(f"巨潮搜索失败: {e}")
            return None
    
    def _try_eastmoney_api(self, stock_code, year):
        """尝试东方财富API"""
        try:
            # 东方财富公告API
            api_url = "https://np-anotice-stock.eastmoney.com/api/security/ann"
            
            params = {
                "sr": -1,
                "page_size": 50,
                "page_index": 1,
                "ann_type": "A",
                "client_source": "web",
                "stock_list": stock_code,
                "f_node": "0",
                "s_node": "0"
            }
            
            response = self.session.get(api_url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                for item in data.get('data', {}).get('list', []):
                    title = item.get('title', '')
                    if self._is_annual_report(title, year):
                        # 构建PDF下载链接
                        art_code = item.get('art_code', '')
                        if art_code:
                            pdf_url = f"https://pdf.dfcfw.com/pdf/H2_{art_code}_1.pdf"
                            filename = f"A股_{stock_code}_{year}年年度报告.pdf"
                            
                            if self._download_pdf(pdf_url, filename):
                                return {'status': 'success', 'filename': filename}
            
            return None
            
        except Exception as e:
            logger.debug(f"东方财富API失败: {e}")
            return None
    
    def download_hk_stock_report(self, stock_code, year):
        """下载港股年报 - 改进版"""
        code = stock_code.zfill(5)
        logger.info(f"下载港股 {code} {year}年年报...")
        
        try:
            # 方法1: 港交所官方API
            result = self._try_hkex_api(code, year)
            if result:
                return result
            
            # 方法2: 港交所搜索页面
            result = self._try_hkex_search(code, year)
            if result:
                return result
            
            return {'status': 'not_found', 'message': f'未找到{year}年年报'}
            
        except Exception as e:
            logger.error(f"港股下载异常: {e}")
            return {'status': 'failed', 'error': str(e)}
    
    def _try_hkex_api(self, stock_code, year):
        """尝试港交所API"""
        try:
            # 港交所披露API
            api_url = "https://www1.hkexnews.hk/search/titlesearch.xhtml"
            
            params = {
                "lang": "C",
                "category": "0",
                "market": "SEHK",
                "stockId": stock_code,
                "documentType": "0", 
                "fromDate": f"01/01/{year}",
                "toDate": f"31/12/{year+1}",
                "submit": "搜寻",
                "sortDir": "0",
                "alert": "0"
            }
            
            response = self.session.get(api_url, params=params, timeout=30)
            
            if response.status_code == 200:
                content = response.text
                
                # 改进的年报匹配模式
                patterns = [
                    rf'href="([^"]*)"[^>]*>[^<]*{year}[^<]*年報[^<]*(?!摘要)',
                    rf'href="([^"]*)"[^>]*>[^<]*{year}[^<]*Annual\s+Report[^<]*(?!Summary)',
                    rf'href="([^"]*)"[^>]*>[^<]*年度報告[^<]*{year}[^<]*(?!摘要)',
                    rf'href="([^"]*)"[^>]*>[^<]*年度业绩[^<]*(?!摘要)',
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        pdf_url = urljoin("https://www1.hkexnews.hk", matches[0])
                        filename = f"港股_{stock_code}_{year}年年度报告.pdf"
                        
                        if self._download_pdf(pdf_url, filename):
                            return {'status': 'success', 'filename': filename}
            
            return None
            
        except Exception as e:
            logger.debug(f"港交所API失败: {e}")
            return None
    
    def _try_hkex_search(self, stock_code, year):
        """尝试港交所搜索页面的不同方法"""
        try:
            # 使用更简单的搜索URL
            search_url = f"https://www1.hkexnews.hk/listedco/listconews/sehk/{stock_code[:2]}/{stock_code}/LTN{year}_C.htm"
            
            response = self.session.get(search_url, timeout=30)
            
            if response.status_code == 200:
                # 在页面中查找年报链接
                content = response.text
                
                # 查找PDF链接
                pdf_patterns = [
                    rf'href="([^"]*\.pdf)"[^>]*>[^<]*{year}[^<]*年報',
                    rf'href="([^"]*\.pdf)"[^>]*>[^<]*Annual[^<]*Report[^<]*{year}',
                ]
                
                for pattern in pdf_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        pdf_url = urljoin("https://www1.hkexnews.hk", matches[0])
                        filename = f"港股_{stock_code}_{year}年年度报告.pdf"
                        
                        if self._download_pdf(pdf_url, filename):
                            return {'status': 'success', 'filename': filename}
            
            return None
            
        except Exception as e:
            logger.debug(f"港交所搜索失败: {e}")
            return None
    
    def _is_annual_report(self, title, year):
        """判断是否为年报"""
        title_lower = title.lower()
        year_str = str(year)
        
        # 排除条件
        exclude_keywords = ['摘要', 'summary', '更正', 'correction', '补充', '修订']
        if any(keyword in title_lower for keyword in exclude_keywords):
            return False
        
        # 包含条件
        include_patterns = [
            f'{year_str}年年度报告',
            f'{year_str}年报',
            f'{year_str} annual report',
            f'annual report {year_str}',
            f'{year_str}年度报告',
        ]
        
        return any(pattern in title_lower for pattern in include_patterns)
    
    def _download_pdf(self, url, filename):
        """下载PDF文件"""
        filepath = self.download_dir / filename
        
        if filepath.exists():
            logger.info(f"文件已存在: {filename}")
            return True
        
        try:
            logger.info(f"开始下载: {filename}")
            
            response = self.session.get(url, stream=True, timeout=60)
            
            if response.status_code != 200:
                logger.warning(f"HTTP状态码: {response.status_code}")
                return False
            
            # 检查内容类型
            content_type = response.headers.get('content-type', '').lower()
            if 'pdf' not in content_type and len(response.content) < 1000:
                logger.warning("下载的文件可能不是PDF")
                return False
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            
            file_size = filepath.stat().st_size
            if file_size < 1000:  # 文件太小，可能是错误页面
                filepath.unlink()
                logger.warning("下载的文件太小，可能是错误页面")
                return False
            
            size_mb = file_size / 1024 / 1024
            logger.info(f"下载完成: {filename} ({size_mb:.2f} MB)")
            return True
            
        except Exception as e:
            if filepath.exists():
                filepath.unlink()
            logger.error(f"下载失败: {e}")
            return False
    
    def download_reports(self, stock_codes, years):
        """批量下载年报"""
        results = []
        
        for stock_code in stock_codes:
            market = self.detect_market(stock_code)
            logger.info(f"处理 {stock_code} ({market})")
            
            for year in years:
                if market == 'A股':
                    result = self.download_a_stock_report(stock_code, year)
                else:
                    result = self.download_hk_stock_report(stock_code, year)
                
                result.update({
                    'stock_code': stock_code,
                    'year': year,
                    'market': market
                })
                
                results.append(result)
                time.sleep(2)  # 增加延时
        
        return results

def read_codes_from_file(filepath):
    """从文件读取股票代码"""
    codes = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # 提取股票代码（忽略注释）
                    code = line.split()[0] if line.split() else ''
                    if code:
                        codes.append(code)
    except Exception as e:
        logger.error(f"读取文件失败: {e}")
    
    return codes

def parse_years(year_str):
    """解析年份范围"""
    if '-' in year_str:
        start, end = map(int, year_str.split('-'))
        return list(range(start, end + 1))
    else:
        return [int(year_str)]

def generate_report(results):
    """生成下载报告"""
    total = len(results)
    success = len([r for r in results if r.get('status') == 'success'])
    not_found = len([r for r in results if r.get('status') == 'not_found'])
    failed = len([r for r in results if r.get('status') == 'failed'])
    
    report = f"""
========== 下载报告 ==========
总计: {total} 个文件
下载成功: {success} 个
未找到: {not_found} 个  
下载失败: {failed} 个

详细结果:"""
    
    for result in results:
        status = result.get('status', 'unknown')
        stock_code = result.get('stock_code', '')
        year = result.get('year', '')
        
        if status == 'success':
            filename = result.get('filename', '')
            report += f"\n  {stock_code} {year}年: ✅ 下载成功 - {filename}"
        elif status == 'not_found':
            message = result.get('message', '未找到年报')
            report += f"\n  {stock_code} {year}年: ❌ 未找到 - {message}"
        else:
            error = result.get('error', '下载失败')
            report += f"\n  {stock_code} {year}年: ❌ 下载失败 - {error}"
    
    return report

def main():
    parser = argparse.ArgumentParser(description='股票年报下载工具 v2.0')
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('-c', '--codes', nargs='+', help='股票代码列表')
    group.add_argument('-f', '--file', help='股票代码文件')
    
    parser.add_argument('-y', '--years', required=True, help='年份范围 (如: 2022 或 2020-2022)')
    parser.add_argument('-d', '--dir', default='annual_reports', help='下载目录')
    
    args = parser.parse_args()
    
    # 获取股票代码
    if args.codes:
        stock_codes = args.codes
    else:
        stock_codes = read_codes_from_file(args.file)
        if not stock_codes:
            logger.error("未读取到有效的股票代码")
            return
    
    # 解析年份
    try:
        years = parse_years(args.years)
    except ValueError:
        logger.error("年份格式错误")
        return
    
    # 开始下载
    downloader = StockReportDownloader(args.dir)
    logger.info(f"开始下载任务: {len(stock_codes)} 个股票, {len(years)} 个年份")
    
    start_time = time.time()
    results = downloader.download_reports(stock_codes, years)
    end_time = time.time()
    
    # 生成报告
    report = generate_report(results)
    print(report)
    
    # 保存报告
    report_file = downloader.download_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    logger.info(f"任务完成，耗时 {end_time - start_time:.1f} 秒")
    logger.info(f"报告已保存: {report_file}")

if __name__ == "__main__":
    main() 