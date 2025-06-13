#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版股票年报下载工具
专注基础功能，减少依赖

使用方法:
python simple.py 000001 2022
python simple.py 00700 2021
"""

import sys
import re
import time
import requests
from pathlib import Path

def download_a_stock(code, year):
    """下载A股年报 - 使用更简单的方法"""
    print(f"🔍 搜索A股 {code} {year}年年报...")
    
    # 尝试直接构建可能的PDF链接
    potential_urls = [
        # 巨潮资讯常见格式
        f"http://static.cninfo.com.cn/finalpage/{year}-03-{code}.PDF",
        f"http://static.cninfo.com.cn/finalpage/{year}-04-{code}.PDF", 
        f"http://static.cninfo.com.cn/finalpage/{year}-03-{code}_1.PDF",
        f"http://static.cninfo.com.cn/finalpage/{year}-04-{code}_1.PDF",
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    for url in potential_urls:
        try:
            response = requests.head(url, headers=headers, timeout=10)
            if response.status_code == 200:
                return download_file(url, f"A股_{code}_{year}年年度报告.pdf")
        except:
            continue
    
    # 如果直接链接失败，尝试搜索接口
    try:
        return search_cninfo(code, year)
    except Exception as e:
        print(f"  ❌ A股搜索失败: {e}")
        return False

def search_cninfo(code, year):
    """通过巨潮资讯搜索"""
    url = "http://www.cninfo.com.cn/new/hisAnnouncement/query"
    
    # 简化的参数
    data = {
        "stock": code,
        "category": "category_ndbg_szsh",
        "pageNum": 1,
        "pageSize": 30,
        "seDate": f"{year}-01-01~{year+1}-06-30"
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
    }
    
    try:
        response = requests.post(url, data=data, headers=headers, timeout=30)
        
        # 检查是否是JSON响应
        if 'application/json' in response.headers.get('content-type', ''):
            result = response.json()
            
            if result.get('announcements'):
                for item in result['announcements']:
                    title = item.get('announcementTitle', '')
                    if f"{year}年年度报告" in title and "摘要" not in title:
                        pdf_url = f"http://static.cninfo.com.cn/{item['adjunctUrl']}"
                        return download_file(pdf_url, f"A股_{code}_{year}年年度报告.pdf")
        
        print(f"  ❌ 未找到{year}年年报")
        return False
        
    except Exception as e:
        print(f"  ❌ 搜索失败: {e}")
        return False

def download_hk_stock(code, year):
    """下载港股年报 - 简化版"""
    code = code.zfill(5)  # 补齐到5位
    print(f"🔍 搜索港股 {code} {year}年年报...")
    
    # 尝试几种常见的港股年报URL格式
    potential_urls = [
        f"https://www1.hkexnews.hk/listedco/listconews/sehk/{code[:2]}/{code}/LTN{year}C001.pdf",
        f"https://www1.hkexnews.hk/listedco/listconews/sehk/{code[:2]}/{code}/AR{year}C001.pdf",
        f"https://www1.hkexnews.hk/listedco/listconews/sehk/{code[:2]}/{code}/LTN{year}C002.pdf",
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    for url in potential_urls:
        try:
            response = requests.head(url, headers=headers, timeout=10)
            if response.status_code == 200:
                return download_file(url, f"港股_{code}_{year}年年度报告.pdf")
        except:
            continue
    
    # 如果直接链接失败，尝试搜索
    try:
        return search_hkex(code, year)
    except Exception as e:
        print(f"  ❌ 港股搜索失败: {e}")
        return False

def search_hkex(code, year):
    """港交所搜索"""
    search_url = "https://www1.hkexnews.hk/search/titlesearch.xhtml"
    
    params = {
        "lang": "C",
        "market": "SEHK",
        "stockId": code,
        "fromDate": f"01/01/{year}",
        "toDate": f"31/12/{year+1}",
        "sortDir": "0"
    }
    
    try:
        response = requests.get(search_url, params=params, timeout=30)
        content = response.text
        
        # 查找年报PDF链接
        patterns = [
            rf'href="([^"]*\.pdf)"[^>]*>[^<]*{year}[^<]*年報',
            rf'href="([^"]*\.pdf)"[^>]*>[^<]*{year}[^<]*Annual\s*Report',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                # 过滤掉摘要版本
                for match in matches:
                    if "summary" not in match.lower() and "摘要" not in match.lower():
                        pdf_url = f"https://www1.hkexnews.hk{match}"
                        return download_file(pdf_url, f"港股_{code}_{year}年年度报告.pdf")
        
        print(f"  ❌ 未找到{year}年年报")
        return False
        
    except Exception as e:
        print(f"  ❌ 港交所搜索失败: {e}")
        return False

def download_file(url, filename):
    """下载文件"""
    download_dir = Path("annual_reports")
    download_dir.mkdir(exist_ok=True)
    
    filepath = download_dir / filename
    
    if filepath.exists():
        print(f"  ⚠️  文件已存在: {filename}")
        return True
    
    try:
        print(f"  📥 下载中: {filename}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, stream=True, timeout=60)
        
        if response.status_code != 200:
            print(f"  ❌ HTTP错误: {response.status_code}")
            return False
        
        # 检查内容长度
        content_length = response.headers.get('content-length')
        if content_length and int(content_length) < 1000:
            print(f"  ❌ 文件太小，可能不是有效的PDF")
            return False
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        # 检查下载的文件大小
        file_size = filepath.stat().st_size
        if file_size < 1000:
            filepath.unlink()
            print(f"  ❌ 下载的文件太小，删除")
            return False
        
        size_mb = file_size / 1024 / 1024
        print(f"  ✅ 下载完成: {filename} ({size_mb:.2f} MB)")
        return True
        
    except Exception as e:
        if filepath.exists():
            filepath.unlink()
        print(f"  ❌ 下载失败: {e}")
        return False

def detect_market(stock_code):
    """检测市场"""
    code = re.sub(r'[^\d]', '', stock_code)
    return '港股' if len(code) in [4, 5] else 'A股'

def main():
    if len(sys.argv) != 3:
        print("使用方法:")
        print("  python simple.py <股票代码> <年份>")
        print("  python simple.py 000001 2022")
        print("  python simple.py 00700 2021")
        return
    
    stock_code = sys.argv[1]
    year = int(sys.argv[2])
    
    market = detect_market(stock_code)
    print(f"🎯 股票代码: {stock_code}")
    print(f"📊 市场类型: {market}")
    print(f"📅 年份: {year}")
    print()
    
    if market == 'A股':
        success = download_a_stock(stock_code, year)
    else:
        success = download_hk_stock(stock_code, year)
    
    print()
    if success:
        print("🎉 下载完成！")
        print(f"📁 文件保存在: {Path('annual_reports').absolute()}")
    else:
        print("😞 下载失败")
        print("\n💡 可能的原因:")
        print("  - 该年份的年报尚未发布")
        print("  - 股票代码不正确") 
        print("  - 网络连接问题")
        print("  - 目标网站结构发生变化")

if __name__ == "__main__":
    main() 